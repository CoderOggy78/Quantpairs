import numpy as np
import pandas as pd
from dataclasses import dataclass
from itertools import combinations
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pairs_engine import (
    CointegrationAnalyzer, SignalGenerator, PositionSizer,
    RiskManager, Position, TradeRecord, PairSignal
)

class MarketSimulator:
    UNIVERSE = {
        "JPM":   ("Banking",    0.95),
        "BAC":   ("Banking",    1.10),
        "GS":    ("Banking",    1.05),
        "WFC":   ("Banking",    0.90),
        "XOM":   ("Energy",     1.00),
        "CVX":   ("Energy",     0.95),
        "COP":   ("Energy",     1.15),
        "SLB":   ("Energy",     1.20),
        "AAPL":  ("Tech",       1.10),
        "MSFT":  ("Tech",       1.00),
        "GOOGL": ("Tech",       1.05),
        "META":  ("Tech",       1.20),
        "JNJ":   ("Healthcare", 0.70),
        "PFE":   ("Healthcare", 0.75),
        "MRK":   ("Healthcare", 0.72),
        "ABT":   ("Healthcare", 0.68),
        "KO":    ("Consumer",   0.55),
        "PEP":   ("Consumer",   0.52),
        "MCD":   ("Consumer",   0.60),
        "WMT":   ("Consumer",   0.50),
    }

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    def simulate(self, n_days: int = 756, start_price: float = 100.0, vol_annual: float = 0.22) -> pd.DataFrame:
        dt = 1 / 252
        sectors = list(set(v[0] for v in self.UNIVERSE.values()))

        sector_vols  = {s: vol_annual * (0.7 + 0.3 * self.rng.random()) for s in sectors}
        sector_returns = {}
        for s in sectors:
            inn = self.rng.standard_t(df=5, size=n_days) / np.sqrt(5/3)
            sector_returns[s] = inn * sector_vols[s] * np.sqrt(dt)

        regime_probs = [0.55, 0.25, 0.20]
        regime_drift = [0.12, -0.08, 0.01]
        regime = self.rng.choice(3, size=n_days, p=regime_probs)

        # Cointegrated pairs – same sector, correlated OU spread
        coint_pairs = [("JPM","BAC"), ("XOM","CVX"), ("KO","PEP"), ("JNJ","PFE"), ("MSFT","GOOGL"), ("MRK","ABT")]
        ou_spreads = {}
        for a, b in coint_pairs:
            kappa = self.rng.uniform(0.10, 0.30)
            sigma_ou = self.rng.uniform(0.003, 0.010)
            sp = np.zeros(n_days)
            for t in range(1, n_days):
                sp[t] = sp[t-1] + kappa*(0 - sp[t-1])*dt + sigma_ou*self.rng.standard_normal()*np.sqrt(dt)
            ou_spreads[(a,b)] = sp

        prices = {}
        for ticker in self.UNIVERSE:
            sector, beta = self.UNIVERSE[ticker]
            idio_vol = vol_annual * self.rng.uniform(0.06, 0.12)
            log_r = np.zeros(n_days)
            for t in range(n_days):
                log_r[t] = regime_drift[regime[t]]*dt + beta*sector_returns[sector][t] + idio_vol*np.sqrt(dt)*self.rng.standard_normal()

            for (a,b), sp in ou_spreads.items():
                dsp = np.gradient(sp)
                if ticker == a:
                    log_r += dsp * 0.6
                elif ticker == b:
                    log_r -= dsp * 0.6

            start = start_price * self.rng.uniform(0.5, 2.5)
            prices[ticker] = start * np.exp(np.cumsum(log_r))

        dates = pd.bdate_range("2021-01-04", periods=n_days)
        return pd.DataFrame(prices, index=dates)


# ─────────────────────────────────────────────────────────────
#  BACKTEST CONFIG
# ─────────────────────────────────────────────────────────────

@dataclass
class BacktestConfig:
    initial_capital:      float = 1_000_000.0
    lookback_window:      int   = 126
    rebalance_freq:       int   = 5
    entry_threshold:      float = 2.0
    exit_threshold:       float = 0.5
    stop_loss_zscore:     float = 3.5
    max_holding_days:     int   = 45
    transaction_cost_bps: float = 5.0
    slippage_bps:         float = 3.0
    max_positions:        int   = 8
    kelly_fraction:       float = 0.25
    # quality filters
    min_r_squared:        float = 0.70   # only high-R² pairs
    max_half_life:        int   = 30     # fast mean-reverters only
    min_half_life:        int   = 2


# ─────────────────────────────────────────────────────────────
#  BACKTESTER
# ─────────────────────────────────────────────────────────────

class Backtester:
    def __init__(self, config: BacktestConfig):
        self.cfg = config
        self.analyzer   = CointegrationAnalyzer(significance=0.05)
        self.signal_gen = SignalGenerator(
            entry_threshold=config.entry_threshold,
            exit_threshold=config.exit_threshold,
            stop_loss=config.stop_loss_zscore,
        )
        self.risk_mgr = RiskManager(max_pairs=config.max_positions)

        self.equity_curve: list[float] = []
        self.trades: list[TradeRecord] = []
        self.positions: dict[str, Position] = {}
        self.cash = config.initial_capital

    def _key(self, a, b): return f"{a}_{b}"

    def _cost(self, notional): return notional * (self.cfg.transaction_cost_bps + self.cfg.slippage_bps) / 10_000

    def _mtm(self, prices: pd.Series) -> float:
        val = self.cash
        for pos in self.positions.values():
            try:
                pa, pb = prices[pos.ticker_a], prices[pos.ticker_b]
                if pos.direction == "LONG_SPREAD":
                    pnl = (pa - pos.entry_price_a)*pos.shares_a + (pos.entry_price_b - pb)*pos.shares_b
                else:
                    pnl = (pos.entry_price_a - pa)*pos.shares_a + (pb - pos.entry_price_b)*pos.shares_b
                val += pos.capital_allocated + pnl
            except KeyError:
                val += pos.capital_allocated
        return val

    def _open(self, signal: PairSignal, prices: pd.Series, date, sizer: PositionSizer):
        key = self._key(signal.ticker_a, signal.ticker_b)
        if key in self.positions: return
        pa, pb = prices[signal.ticker_a], prices[signal.ticker_b]
        sa, sb, cap = sizer.size(signal, pa, pb)
        if cap + self._cost(cap) > self.cash * 0.90: return
        self.cash -= cap + self._cost(cap)
        self.positions[key] = Position(
            ticker_a=signal.ticker_a, ticker_b=signal.ticker_b,
            direction=signal.signal,
            entry_zscore=signal.zscore, hedge_ratio=signal.hedge_ratio,
            shares_a=sa, shares_b=sb,
            entry_price_a=pa, entry_price_b=pb,
            entry_date=str(date), capital_allocated=cap,
        )

    def _close(self, key, pos: Position, prices: pd.Series, date, exit_z, reason):
        pa, pb = prices[pos.ticker_a], prices[pos.ticker_b]
        if pos.direction == "LONG_SPREAD":
            pnl = (pa - pos.entry_price_a)*pos.shares_a + (pos.entry_price_b - pb)*pos.shares_b
        else:
            pnl = (pos.entry_price_a - pa)*pos.shares_a + (pb - pos.entry_price_b)*pos.shares_b
        net = pnl - self._cost(pos.capital_allocated)
        self.cash += pos.capital_allocated + net
        holding = max(1, (pd.Timestamp(str(date)) - pd.Timestamp(pos.entry_date)).days)
        self.trades.append(TradeRecord(
            ticker_a=pos.ticker_a, ticker_b=pos.ticker_b,
            direction=pos.direction,
            entry_date=pos.entry_date, exit_date=str(date),
            entry_zscore=pos.entry_zscore, exit_zscore=exit_z,
            pnl=net, pnl_pct=net/max(pos.capital_allocated,1),
            holding_days=holding, exit_reason=reason,
        ))
        del self.positions[key]

    def run(self, prices: pd.DataFrame) -> "BacktestResults":
        print("=" * 60)
        print("  PAIRS TRADING BACKTEST — STARTING")
        print("=" * 60)

        tickers = list(prices.columns)
        dates   = prices.index
        sizer   = PositionSizer(self.cfg.initial_capital, kelly_fraction=self.cfg.kelly_fraction)
        active_pairs: list[dict] = []

        for i, date in enumerate(dates):
            if i < self.cfg.lookback_window:
                self.equity_curve.append(self.cfg.initial_capital)
                continue

            today  = prices.iloc[i]
            window = prices.iloc[i - self.cfg.lookback_window: i]

            # ── Manage positions ──────────────────────────────
            to_close = []
            for key, pos in self.positions.items():
                # Re-compute z-score from window
                try:
                    pa = window[pos.ticker_a].values
                    pb = window[pos.ticker_b].values
                    spread = np.log(pa) - pos.hedge_ratio * np.log(pb)
                    z = (spread[-1] - spread.mean()) / (spread.std() + 1e-10)
                except Exception:
                    z = 0.0

                holding = max(1, (date - pd.Timestamp(pos.entry_date)).days)
                reason = None
                if abs(z) < self.cfg.exit_threshold:      reason = "SIGNAL"
                elif abs(z) > self.cfg.stop_loss_zscore:  reason = "STOP_LOSS"
                elif holding > self.cfg.max_holding_days: reason = "MAX_HOLD"
                if reason:
                    to_close.append((key, pos, z, reason))

            for key, pos, z, reason in to_close:
                self._close(key, pos, today, date, z, reason)

            # ── Re-scan pairs (with quality filters) ─────────
            if i % self.cfg.rebalance_freq == 0:
                active_pairs = []
                for ta, tb in combinations(tickers, 2):
                    try:
                        pa = window[ta].values
                        pb = window[tb].values
                        result = self.analyzer.test_pair(pa, pb, ta, tb)
                        if result is None: continue
                        # Quality gates
                        if result["r_squared"]  < self.cfg.min_r_squared:   continue
                        if result["half_life"]  > self.cfg.max_half_life:    continue
                        if result["half_life"]  < self.cfg.min_half_life:    continue
                        active_pairs.append(result)
                    except Exception:
                        continue
                active_pairs.sort(key=lambda x: x["p_value"])

            # ── Open new positions ────────────────────────────
            if self.risk_mgr.can_open_position(len(self.positions)):
                for pi in active_pairs[:15]:
                    key = self._key(pi["ticker_a"], pi["ticker_b"])
                    if key in self.positions: continue
                    sig = self.signal_gen.generate(pi, in_position=False)
                    if sig.signal in ("LONG_SPREAD", "SHORT_SPREAD"):
                        self._open(sig, today, date, sizer)
                    if len(self.positions) >= self.cfg.max_positions: break

            # ── Mark to market ────────────────────────────────
            equity = self._mtm(today)
            self.equity_curve.append(equity)
            self.risk_mgr.check_drawdown(equity)

        # Close all at end
        last = prices.iloc[-1]
        for key in list(self.positions.keys()):
            self._close(key, self.positions[key], last, dates[-1], 0.0, "END_OF_BACKTEST")

        # Final MTM
        if self.equity_curve:
            self.equity_curve[-1] = self.cash

        return BacktestResults(
            equity_curve=pd.Series(
                self.equity_curve,
                index=dates[:len(self.equity_curve)]
            ),
            trades=self.trades,
            initial_capital=self.cfg.initial_capital,
        )


# ─────────────────────────────────────────────────────────────
#  RESULTS
# ─────────────────────────────────────────────────────────────

@dataclass
class BacktestResults:
    equity_curve: pd.Series
    trades: list
    initial_capital: float

    def summary(self) -> dict:
        eq = self.equity_curve.dropna()
        r  = eq.pct_change().dropna()

        total_ret = (eq.iloc[-1] / eq.iloc[0]) - 1
        n_years   = len(eq) / 252
        cagr      = (1 + total_ret) ** (1 / max(n_years, 0.1)) - 1
        vol       = r.std() * np.sqrt(252)
        sharpe    = (r.mean() * 252) / (vol + 1e-10)
        max_dd    = ((eq - eq.cummax()) / eq.cummax()).min()
        calmar    = cagr / abs(max_dd + 1e-10)
        sortino   = (r.mean() * 252) / (r[r<0].std() * np.sqrt(252) + 1e-10)

        pnls = [t.pnl for t in self.trades]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]
        win_rate = len(wins) / max(len(pnls), 1)
        pf = abs(sum(wins) / (sum(losses) + 1e-10))

        return {
            "Total Return":   f"{total_ret:.2%}",
            "CAGR":           f"{cagr:.2%}",
            "Sharpe Ratio":   f"{sharpe:.2f}",
            "Sortino Ratio":  f"{sortino:.2f}",
            "Calmar Ratio":   f"{calmar:.2f}",
            "Max Drawdown":   f"{max_dd:.2%}",
            "Annualized Vol": f"{vol:.2%}",
            "Total Trades":   len(self.trades),
            "Win Rate":       f"{win_rate:.1%}",
            "Avg Win":        f"${np.mean(wins) if wins else 0:,.0f}",
            "Avg Loss":       f"${np.mean(losses) if losses else 0:,.0f}",
            "Profit Factor":  f"{pf:.2f}",
            "Final Equity":   f"${eq.iloc[-1]:,.0f}",
        }

    def print_summary(self):
        s = self.summary()
        print("\n" + "="*50)
        print("  BACKTEST PERFORMANCE SUMMARY")
        print("="*50)
        for k, v in s.items():
            print(f"  {k:<22} {v:>12}")
        print("="*50)

        if self.trades:
            sorted_t = sorted(self.trades, key=lambda x: x.pnl, reverse=True)
            print("\n  TOP 5 TRADES:")
            for t in sorted_t[:5]:
                print(f"  {t.ticker_a}/{t.ticker_b:<10} {t.direction:<15} "
                      f"PnL: ${t.pnl:>8,.0f}  ({t.pnl_pct:>+.1%})  {t.holding_days}d  [{t.exit_reason}]")
            print("\n  BOTTOM 5 TRADES:")
            for t in sorted_t[-5:]:
                print(f"  {t.ticker_a}/{t.ticker_b:<10} {t.direction:<15} "
                      f"PnL: ${t.pnl:>8,.0f}  ({t.pnl_pct:>+.1%})  {t.holding_days}d  [{t.exit_reason}]")
