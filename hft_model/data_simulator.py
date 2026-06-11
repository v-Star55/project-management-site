import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

class LOBSimulator:
    """
    Simulates realistic Limit Order Book (LOB) data.
    Generates time-series data representing depth of book (Bid/Ask prices and quantities).
    """
    def __init__(self, initial_price: float = 100.0, tick_size: float = 0.01, levels: int = 5):
        self.price = initial_price
        self.tick_size = tick_size
        self.levels = levels
        
    def generate_data(self, num_ticks: int = 10000, volatility: float = 0.05, drift: float = 0.0001) -> pd.DataFrame:
        """
        Generates simulated LOB data.
        """
        np.random.seed(42)  # For reproducibility
        
        # Initialize containers for data
        data: Dict[str, List] = {
            "timestamp": []
        }
        for i in range(1, self.levels + 1):
            data[f"bid_price_{i}"] = []
            data[f"bid_qty_{i}"] = []
            data[f"ask_price_{i}"] = []
            data[f"ask_qty_{i}"] = []
        
        current_time = pd.Timestamp("2026-01-01 09:00:00")
        current_mid = self.price
        
        for t in range(num_ticks):
            # Mid price random walk with a small drift and random noise
            price_change = np.random.normal(drift, volatility)
            current_mid += price_change
            current_mid = round(current_mid / self.tick_size) * self.tick_size
            
            # Generate spread
            spread = max(self.tick_size, round(np.random.exponential(scale=0.03) / self.tick_size) * self.tick_size)
            
            bid_1 = current_mid - spread / 2
            ask_1 = current_mid + spread / 2
            
            # Ensure proper rounding to tick size
            bid_1 = round(bid_1 / self.tick_size) * self.tick_size
            ask_1 = round(ask_1 / self.tick_size) * self.tick_size
            if bid_1 >= ask_1:
                ask_1 = bid_1 + self.tick_size

            # Timestamp increment: microsecond-scale random intervals
            time_inc = np.random.exponential(scale=100) # milliseconds
            current_time += pd.Timedelta(milliseconds=time_inc)
            data["timestamp"].append(current_time)

            # Generate order book levels
            for level in range(1, self.levels + 1):
                offset = (level - 1) * self.tick_size
                bp = bid_1 - offset
                ap = ask_1 + offset
                
                # Volumes are modeled with a log-normal distribution to resemble real markets
                bq = int(np.random.lognormal(mean=4.0, sigma=0.8)) + 1
                aq = int(np.random.lognormal(mean=4.0, sigma=0.8)) + 1
                
                data[f"bid_price_{level}"].append(bp)
                data[f"bid_qty_{level}"].append(bq)
                data[f"ask_price_{level}"].append(ap)
                data[f"ask_qty_{level}"].append(aq)
                
        df = pd.DataFrame(data)
        df.set_index("timestamp", inplace=True)
        return df

if __name__ == "__main__":
    sim = LOBSimulator()
    df = sim.generate_data(10)
    print(df.head())
