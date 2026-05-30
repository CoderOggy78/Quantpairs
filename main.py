"""
╔══════════════════════════════════════════════════════════════╗
║   QUANT PAIRS TRADING — MAIN RUNNER                          ║
╚══════════════════════════════════════════════════════════════╝
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import numpy as np
import pandas as pd
from backtester import MarketSimulator, Backtester, BacktestConfig

def run_backtest():
    print("\n╔══════════════════════════════════════════════════════╗")
    print("║   STATISTICAL ARBITRAGE — PAIRS TRADING ENGINE      ║")
    print("║   Strategy: Cointegration + Mean Reversion          ║")
    print("╚══════════════════════════════════════════════════════╝\n")

    print("📊 Simulating 3 years of market data (20 equities)...")
    sim    = MarketSimulator(seed=42)
    prices = sim.simulate(n_days=756)
    print(f"   ✓ {len(prices)} trading days × {len(prices.columns)} tickers")
    print(f"   ✓ {prices.index[0].date()} → {prices.index[-1].date()}")

    config = BacktestConfig(
        initial_capital=1_000_000,
        lookback_window=126,
        rebalance_freq=5,
        entry_threshold=2.0,
        exit_threshold=0.5,
        stop_loss_zscore=3.5,
        max_holding_days=45,
        transaction_cost_bps=5,
        slippage_bps=3,
        max_positions=8,
        kelly_fraction=0.25,
        min_r_squared=0.70,
        max_half_life=30,
        min_half_life=2,
    )

    print(f"\n⚙️  Config: Capital=${config.initial_capital:,.0f} | Entry±{config.entry_threshold} | "
          f"Exit±{config.exit_threshold} | SL±{config.stop_loss_zscore} | MaxPos={config.max_positions}")

    bt      = Backtester(config)
    results = bt.run(prices)
    results.print_summary()

    os.makedirs("results", exist_ok=True)

    eq_df = pd.DataFrame({
        "date":         results.equity_curve.index,
        "equity":       results.equity_curve.values,
        "daily_return": results.equity_curve.pct_change().values,
    })
    eq_df.to_csv("results/equity_curve.csv", index=False)

    if results.trades:
        rows = []
        for t in results.trades:
            rows.append({
                "pair":          f"{t.ticker_a}/{t.ticker_b}",
                "ticker_a":      t.ticker_a,
                "ticker_b":      t.ticker_b,
                "direction":     t.direction,
                "entry_date":    t.entry_date,
                "exit_date":     t.exit_date,
                "entry_zscore":  round(t.entry_zscore, 3),
                "exit_zscore":   round(t.exit_zscore, 3),
                "holding_days":  t.holding_days,
                "pnl":           round(t.pnl, 2),
                "pnl_pct":       round(t.pnl_pct * 100, 2),
                "exit_reason":   t.exit_reason,
            })
        trades_df = pd.DataFrame(rows)
        trades_df.to_csv("results/trades.csv", index=False)
        print(f"\n💾 results/equity_curve.csv  |  results/trades.csv ({len(results.trades)} trades)")

        print("\n📈 PERFORMANCE BY EXIT REASON:")
        for reason, g in trades_df.groupby("exit_reason"):
            wr = (g["pnl"] > 0).mean()
            print(f"   {reason:<20} {len(g):>3} trades | WR: {wr:.0%} | Avg PnL: ${g['pnl'].mean():>8,.0f}")

        print("\n📊 TOP PAIRS BY TOTAL PNL:")
        gp = trades_df.groupby("pair")["pnl"].agg(total="sum", count="count", avg="mean").sort_values("total", ascending=False)
        for pair, row in gp.head(8).iterrows():
            print(f"   {pair:<14} Total: ${row['total']:>8,.0f} | {int(row['count']):>2} trades | Avg: ${row['avg']:>7,.0f}")

    print("\n✅ Done!\n")
    return results


if __name__ == "__main__":
    os.makedirs("results", exist_ok=True)
    run_backtest()
