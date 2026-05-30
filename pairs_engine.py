import numpy as np
import pandas as pd
from scipy import stats
from itertools import combinations
from dataclasses import dataclass, field
from typing import Optional
import warnings
warnings.filterwarnings("ignore")

@dataclass
class PairSignal:
    ticker_a: str
    ticker_b: str
    hedge_ratio: float
    spread_mean: float
    spread_std: float
    zscore: float
    signal: str
    confidence: float
    half_life: float

@dataclass
class Position:
    ticker_a: str
    ticker_b: str
    direction: str
    entry_zscore: float
    hedge_ratio: float
    shares_a: float
    shares_b: float
    entry_price_a: float
    entry_price_b: float
    entry_date: str
    capital_allocated: float
    stop_loss_zscore: float = 3.5


@dataclass
class TradeRecord:
    ticker_a: str
    ticker_b: str
    direction: str
    entry_date: str
    exit_date: str
    entry_zscore: float
    exit_zscore: float
    pnl: float
    pnl_pct: float
    holding_days: int
    exit_reason: str


class CointegrationAnalyzer:
    def __init__(self, significance: float = 0.05):
        self.significance = significance

    def adf_test_simple(self, series: np.ndarray) -> tuple:
        """Simplified but more accurate ADF test."""
        n = len(series)
        y     = np.diff(series)
        x_lag = series[:-1]

        # OLS: Δy = α + β*y_{t-1} + ε
        X = np.column_stack([np.ones(n-1), x_lag])
        try:
            beta = np.linalg.lstsq(X, y, rcond=None)[0]
            resid = y - X @ beta
            s2    = resid.var()
            XtX_inv = np.linalg.inv(X.T @ X)
            se    = np.sqrt(s2 * XtX_inv[1, 1])
            t_stat = beta[1] / (se + 1e-12)
        except Exception:
            return 0.0, 1.0

        # MacKinnon (1994) response surface — no-trend case
        # 5% CV for different n
        if n > 500:   cv5 = -2.864
        elif n > 250: cv5 = -2.876
        elif n > 100: cv5 = -2.900
        else:         cv5 = -2.930

        if t_stat < cv5 - 0.5:   p = 0.01
        elif t_stat < cv5:        p = 0.04
        elif t_stat < cv5 + 0.3: p = 0.08
        elif t_stat < cv5 + 0.7: p = 0.15
        elif t_stat < -2.0:       p = 0.25
        else:                     p = 0.60

        return t_stat, p

    def estimate_hedge_ratio(self, price_a: np.ndarray, price_b: np.ndarray) -> tuple:
        """TLS (Total Least Squares) hedge ratio — avoids bias from choice of dependent var."""
        log_a = np.log(price_a)
        log_b = np.log(price_b)
        # Center
        mu_a, mu_b = log_a.mean(), log_b.mean()
        ca, cb = log_a - mu_a, log_b - mu_b
        # Cov matrix
        cov_aa = (ca**2).mean()
        cov_bb = (cb**2).mean()
        cov_ab = (ca * cb).mean()
        # TLS beta
        delta  = cov_aa - cov_bb
        beta   = (delta + np.sqrt(delta**2 + 4*cov_ab**2)) / (2*cov_ab + 1e-10)
        # R²
        slope, _, r, _, _ = stats.linregress(log_b, log_a)
        return abs(beta), r**2

    def compute_half_life(self, spread: np.ndarray) -> float:
        spread_lag  = spread[:-1]
        spread_diff = np.diff(spread)
        slope, _, _, _, _ = stats.linregress(spread_lag, spread_diff)
        if slope >= 0:
            return np.inf
        return -np.log(2) / (slope + 1e-12)

    def hurst_exponent(self, series: np.ndarray, max_lag: int = 20) -> float:
        """Hurst < 0.5 → mean-reverting. Hurst ~ 0.5 → random walk."""
        lags = range(2, min(max_lag, len(series)//4))
        tau  = []
        for lag in lags:
            diff = series[lag:] - series[:-lag]
            tau.append(np.std(diff))
        if len(tau) < 3:
            return 0.5
        log_lags = np.log(list(lags))
        log_tau  = np.log(tau)
        slope, _, _, _, _ = stats.linregress(log_lags, log_tau)
        return slope   # H = slope

    def test_pair(self, price_a: np.ndarray, price_b: np.ndarray, ta: str, tb: str) -> Optional[dict]:
        hedge_ratio, r_sq = self.estimate_hedge_ratio(price_a, price_b)

        log_a = np.log(price_a)
        log_b = np.log(price_b)
        spread = log_a - hedge_ratio * log_b
        spread = spread - spread.mean()   # de-mean

        t_stat, p_value = self.adf_test_simple(spread)
        if p_value > self.significance:
            return None

        half_life = self.compute_half_life(spread)
        hurst     = self.hurst_exponent(spread)

        # Hurst < 0.5 confirms mean reversion
        if hurst > 0.50:
            return None

        return {
            "ticker_a":      ta,
            "ticker_b":      tb,
            "hedge_ratio":   hedge_ratio,
            "r_squared":     r_sq,
            "adf_stat":      t_stat,
            "p_value":       p_value,
            "half_life":     half_life,
            "hurst":         hurst,
            "spread_mean":   spread.mean(),
            "spread_std":    spread.std(),
            "current_zscore": (spread[-1] - spread.mean()) / (spread.std() + 1e-10),
        }


class SignalGenerator:
    def __init__(self, entry_threshold=2.0, exit_threshold=0.5, stop_loss=3.5):
        self.entry_threshold = entry_threshold
        self.exit_threshold  = exit_threshold
        self.stop_loss       = stop_loss

    def generate(self, pair_info: dict, in_position: bool = False) -> PairSignal:
        z = pair_info["current_zscore"]
        p = pair_info["p_value"]

        if not in_position:
            if z < -self.entry_threshold:   signal = "LONG_SPREAD"
            elif z > self.entry_threshold:  signal = "SHORT_SPREAD"
            else:                           signal = "HOLD"
        else:
            if abs(z) < self.exit_threshold:       signal = "EXIT"
            elif abs(z) > self.stop_loss:          signal = "STOP_LOSS"
            else:                                  signal = "HOLD"

        return PairSignal(
            ticker_a=pair_info["ticker_a"], ticker_b=pair_info["ticker_b"],
            hedge_ratio=pair_info["hedge_ratio"],
            spread_mean=pair_info["spread_mean"], spread_std=pair_info["spread_std"],
            zscore=z, signal=signal, confidence=1-p, half_life=pair_info["half_life"],
        )


class PositionSizer:
    def __init__(self, total_capital: float, max_position_pct=0.12, kelly_fraction=0.25):
        self.total_capital    = total_capital
        self.max_position_pct = max_position_pct
        self.kelly_fraction   = kelly_fraction

    def size(self, signal: PairSignal, price_a: float, price_b: float,
             win_rate=0.58, avg_win_loss_ratio=1.4) -> tuple:
        b = avg_win_loss_ratio
        p = win_rate
        kelly    = (b*p - (1-p)) / b
        fraction = min(kelly * self.kelly_fraction, self.max_position_pct)
        fraction = max(fraction, 0.01)
        capital  = self.total_capital * fraction
        shares_a = capital / (2 * price_a)
        shares_b = signal.hedge_ratio * shares_a * (price_a / price_b)
        return shares_a, shares_b, capital


class RiskManager:
    def __init__(self, max_drawdown=0.15, max_pairs=8):
        self.max_drawdown          = max_drawdown
        self.max_pairs             = max_pairs
        self.circuit_breaker_active = False
        self.peak_equity           = None

    def check_drawdown(self, current_equity: float) -> bool:
        if self.peak_equity is None: self.peak_equity = current_equity
        self.peak_equity = max(self.peak_equity, current_equity)
        dd = (self.peak_equity - current_equity) / self.peak_equity
        if dd > self.max_drawdown:
            self.circuit_breaker_active = True
            return False
        return True

    def can_open_position(self, open_positions: int) -> bool:
        return not self.circuit_breaker_active and open_positions < self.max_pairs
