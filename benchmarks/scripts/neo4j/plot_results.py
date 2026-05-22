import json
import os
import numpy as np

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

BASE_DIR = os.path.dirname(__file__)

RESULTS_DIR = os.path.join(BASE_DIR, "results")
PLOTS_DIR = os.path.join(BASE_DIR, "plots")

os.makedirs(PLOTS_DIR, exist_ok=True)

sns.set_theme(style="whitegrid")

plt.rcParams["figure.figsize"] = (14, 7)

# Load JSON files
with open(os.path.join(RESULTS_DIR, "evolution_results.json")) as f:
    evolution_data = json.load(f)

with open(os.path.join(RESULTS_DIR, "effectiveness_results.json")) as f:
    effectiveness_data = json.load(f)

with open(os.path.join(RESULTS_DIR, "validation_results.json")) as f:
    validation_data = json.load(f)

with open(os.path.join(RESULTS_DIR, "weakness_results.json")) as f:
    weakness_data = json.load(f)

# Helper function to extract benchmark metrics
def benchmark_metrics(item):
    if "benchmark" in item:
        src = item["benchmark"]
    else:
        src = item

    return {
        "median": float(src.get("median", 0)),
        "p95": float(src.get("p95", 0)),
        "mean": float(src.get("mean", 0)),
    }


# Evolution Plot
evolution_rows = []

for item in evolution_data:
    metrics = benchmark_metrics(item)

    evolution_rows.append({
        "pokemon": item["pokemon"],
        **metrics
    })

evolution_df = pd.DataFrame(evolution_rows)

evolution_df = evolution_df.sort_values("mean", ascending=False)

x = range(len(evolution_df))

plt.figure(figsize=(18, 8))

plt.bar(
    x,
    evolution_df["mean"],
    alpha=0.8,
    label="Mean"
)

plt.plot(
    x,
    evolution_df["median"],
    marker="o",
    linewidth=2,
    label="Median"
)

plt.plot(
    x,
    evolution_df["p95"],
    marker="x",
    linewidth=2,
    label="P95"
)

plt.xticks(
    x,
    evolution_df["pokemon"],
    rotation=75,
    ha="right"
)

plt.title("Evolution Query Benchmark")
plt.xlabel("Pokemon")
plt.ylabel("Latency (ms)")
plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(PLOTS_DIR, "evolution_benchmark.png"),
    dpi=300
)

plt.close()

# Effectiveness Plot
effectiveness_rows = []

for item in effectiveness_data:
    metrics = benchmark_metrics(item)

    effectiveness_rows.append({
        "type": item["type"],
        **metrics
    })

effectiveness_df = pd.DataFrame(effectiveness_rows)

effectiveness_df = effectiveness_df.sort_values("mean", ascending=False)

x = range(len(effectiveness_df))

plt.figure(figsize=(16, 8))

plt.bar(
    x,
    effectiveness_df["mean"],
    alpha=0.8,
    label="Mean"
)

plt.plot(
    x,
    effectiveness_df["median"],
    marker="o",
    linewidth=2,
    label="Median"
)

plt.plot(
    x,
    effectiveness_df["p95"],
    marker="x",
    linewidth=2,
    label="P95"
)

plt.xticks(
    x,
    effectiveness_df["type"],
    rotation=45
)

plt.title("Type Effectiveness Benchmark")
plt.xlabel("Pokemon Type")
plt.ylabel("Latency (ms)")
plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(PLOTS_DIR, "effectiveness_benchmark.png"),
    dpi=300
)

plt.close()

# Validation Plot
validation_rows = []

for item in validation_data:
    metrics = benchmark_metrics(item)

    validation_rows.append({
        "team": ", ".join(item["team"][:2]) + "...",
        "team_size": len(item["team"]),
        **metrics
    })

validation_df = pd.DataFrame(validation_rows)

validation_df = validation_df.sort_values("mean", ascending=False)

x = range(len(validation_df))

plt.figure(figsize=(18, 8))

plt.bar(
    x,
    validation_df["mean"],
    alpha=0.8,
    color="orange",
    label="Mean"
)

plt.plot(
    x,
    validation_df["median"],
    marker="o",
    linewidth=2,
    label="Median"
)

plt.plot(
    x,
    validation_df["p95"],
    marker="x",
    linewidth=2,
    label="P95"
)

plt.xticks(
    x,
    validation_df["team"],
    rotation=70,
    ha="right"
)

plt.title("Validation Benchmark")
plt.xlabel("Teams")
plt.ylabel("Latency (ms)")
plt.legend()

plt.tight_layout()

plt.savefig(
    os.path.join(PLOTS_DIR, "validation_benchmark.png"),
    dpi=300
)

plt.close()

# Weakness Plot
weakness_rows = []

for item in weakness_data:

    benchmark = item["benchmark"]

    weakness_rows.append({
        "team": ", ".join(item["team"][:2]) + "...",
        "median": benchmark["median"],
        "mean": benchmark["mean"],
        "p95": benchmark["p95"],
        "tail_ratio": benchmark["p95"] / benchmark["median"]
    })

weakness_df = pd.DataFrame(weakness_rows)

# Sort by p95 to highlight worst tail latency
weakness_df = weakness_df.sort_values("p95", ascending=False)


x = np.arange(len(weakness_df))

width = 0.25

fig, ax = plt.subplots(figsize=(18, 9))

# grouped bars
ax.bar(
    x - width,
    weakness_df["median"],
    width,
    label="Median",
    color="#4CAF50"
)

ax.bar(
    x,
    weakness_df["mean"],
    width,
    label="Mean",
    color="#2196F3"
)

ax.bar(
    x + width,
    weakness_df["p95"],
    width,
    label="P95",
    color="#F44336"
)

# Tail latency ratio annotations

for i, ratio in enumerate(weakness_df["tail_ratio"]):

    ax.text(
        i + width,
        weakness_df["p95"].iloc[i] + 5,
        f"{ratio:.1f}x",
        ha="center",
        fontsize=9,
        color="black"
    )

# Labels

ax.set_xticks(x)

ax.set_xticklabels(
    weakness_df["team"],
    rotation=70,
    ha="right"
)

ax.set_ylabel("Latency (ms)")
ax.set_title("Weakness Benchmark Analysis")

ax.legend()

# Optional threshold line
ax.axhline(
    y=150,
    linestyle="--",
    color="gray",
    alpha=0.6,
    label="150ms Threshold"
)

plt.tight_layout()

plt.savefig(
    os.path.join(PLOTS_DIR, "weakness_benchmark.png"),
    dpi=300
)

plt.close()

# Combined Heatmap

combined_rows = []

for _, row in effectiveness_df.iterrows():
    combined_rows.append({
        "label": f"effectiveness-{row['type']}",
        "mean": row["mean"],
        "median": row["median"],
        "p95": row["p95"]
    })

for _, row in evolution_df.iterrows():
    combined_rows.append({
        "label": f"evolution-{row['pokemon']}",
        "mean": row["mean"],
        "median": row["median"],
        "p95": row["p95"]
    })

heatmap_df = pd.DataFrame(combined_rows)

heatmap_df = heatmap_df.set_index("label")

plt.figure(figsize=(12, 18))

sns.heatmap(
    heatmap_df,
    cmap="viridis",
    annot=True,
    fmt=".1f"
)

plt.title("Benchmark Metrics Heatmap")

plt.tight_layout()

plt.savefig(
    os.path.join(PLOTS_DIR, "benchmark_heatmap.png"),
    dpi=300
)

plt.close()

# --- MongoDB Benchmarks ---
MONGO_RESULTS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "mongodb", "results"))
MONGO_PLOTS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "mongodb", "plots"))
os.makedirs(MONGO_PLOTS_DIR, exist_ok=True)

# Load MongoDB files
mongo_pokemon_file = os.path.join(MONGO_RESULTS_DIR, "pokemon_results.json")
mongo_list_file = os.path.join(MONGO_RESULTS_DIR, "list_results.json")

if os.path.exists(mongo_pokemon_file):
    with open(mongo_pokemon_file) as f:
        mongo_pokemon_data = json.load(f)
    
    mongo_pokemon_rows = []
    for item in mongo_pokemon_data:
        metrics = benchmark_metrics(item)
        mongo_pokemon_rows.append({
            "pokemon": item["pokemon"],
            **metrics
        })
    mongo_pokemon_df = pd.DataFrame(mongo_pokemon_rows)
    mongo_pokemon_df = mongo_pokemon_df.sort_values("mean", ascending=False)
    
    x = range(len(mongo_pokemon_df))
    plt.figure(figsize=(18, 8))
    plt.bar(x, mongo_pokemon_df["mean"], alpha=0.8, color="skyblue", label="Mean")
    plt.plot(x, mongo_pokemon_df["median"], marker="o", linewidth=2, color="blue", label="Median")
    plt.plot(x, mongo_pokemon_df["p95"], marker="x", linewidth=2, color="red", label="P95")
    plt.xticks(x, mongo_pokemon_df["pokemon"], rotation=75, ha="right")
    plt.title("MongoDB Pokemon Query Benchmark (findOne)")
    plt.xlabel("Pokemon")
    plt.ylabel("Latency (ms)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(MONGO_PLOTS_DIR, "mongodb_pokemon_benchmark.png"), dpi=300)
    plt.close()

if os.path.exists(mongo_list_file):
    with open(mongo_list_file) as f:
        mongo_list_data = json.load(f)
    
    mongo_list_rows = []
    for item in mongo_list_data:
        metrics = benchmark_metrics(item)
        mongo_list_rows.append({
            "query": item["query"],
            **metrics
        })
    mongo_list_df = pd.DataFrame(mongo_list_rows)
    
    plt.figure(figsize=(8, 6))
    bars = plt.bar(["Mean", "Median", "P95"], [mongo_list_df["mean"].iloc[0], mongo_list_df["median"].iloc[0], mongo_list_df["p95"].iloc[0]], color=["skyblue", "blue", "red"])
    plt.title("MongoDB List All Query Benchmark (find)")
    plt.ylabel("Latency (ms)")
    # Add values on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, yval + 0.05, f"{yval:.2f} ms", ha='center', va='bottom')
    plt.tight_layout()
    plt.savefig(os.path.join(MONGO_PLOTS_DIR, "mongodb_list_benchmark.png"), dpi=300)
    plt.close()

print(f"Plots saved to: {PLOTS_DIR} and {MONGO_PLOTS_DIR}")