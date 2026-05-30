import os
import json
import pandas as pd
import numpy as np
import umap

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # We put raw files (csv and bin) inside a git-ignored 'data' folder at root level
    data_dir = os.path.join(project_root, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    public_dir = os.path.join(project_root, 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'epicure_core.csv')
    bin_path = os.path.join(data_dir, 'dataset.bin')
    json_path = os.path.join(public_dir, 'ingredients.json')

    if not os.path.exists(csv_path):
        # Fall back to downloading from Hugging Face if missing
        print(f"Local dataset not found at {csv_path}. Downloading from Hugging Face CDN...")
        CSV_URL = "https://huggingface.co/datasets/Kaikaku/epicure-corpus-resources/resolve/main/data/epicure_core.csv"
        try:
            import urllib.request
            urllib.request.urlretrieve(CSV_URL, csv_path)
            print("Download completed successfully.")
        except Exception as e:
            print(f"Failed to download dataset from Hugging Face: {e}")
            return
    else:
        print(f"Found local dataset at: {csv_path}. Processing offline...")

    # Load and parse CSV
    df = pd.read_csv(csv_path)
    print(f"Parsed CSV: {len(df)} rows.")

    # Get dimension columns (dim_0 to dim_299)
    dim_cols = [c for c in df.columns if c.startswith('dim_')]
    dim_count = len(dim_cols)
    print(f"Vector dimensions: {dim_count} columns.")

    raw_names = df['name'].values
    ids = df['node_id'].values
    vectors = df[dim_cols].values.astype(np.float32)

    # 1. Normalize each vector (L2 norm = 1.0)
    print("Normalizing vector embeddings...")
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    # Avoid division by zero
    norms = np.where(norms > 0, norms, 1.0).astype(np.float32)
    normalized_vectors = vectors / norms

    # 2. Precompute taste projections
    taste_anchors = {
        "Sweet":     "brown_sugar",
        "Sour":      "apple_cider_vinegar",
        "Salty":     "bamboo_salt",
        "Bitter":    "cocoa_butter",
        "Umami":     "msg",
        "Spicy":     "chili_pepper",
        "Herbal":    "basil",
        "Citrusy":   "lemon",
        "Smoky":     "bacon",
        "FattyRich": "almond_butter"
    }

    # Resolve vector anchors in the vocabulary
    anchor_vectors = {}
    for taste, raw_name in taste_anchors.items():
        # Look for exact match or substring match
        matches = [i for i, n in enumerate(raw_names) if n.lower() == raw_name or raw_name in n.lower()]
        if matches:
            idx = matches[0]
            anchor_vectors[taste] = normalized_vectors[idx]
            print(f"Anchor resolved: [{taste}] -> \"{raw_names[idx]}\"")
        else:
            anchor_vectors[taste] = normalized_vectors[0]
            print(f"Warning: Anchor not found for [{taste}], using fallback")

    # Project every vector onto the anchors
    print("Computing sensory projections...")
    TASTE_KEYS = ["Sweet", "Sour", "Salty", "Bitter", "Umami", "Spicy", "Herbal", "Citrusy", "Smoky", "FattyRich"]
    projections = np.zeros((len(df), len(TASTE_KEYS)), dtype=np.float32)

    for i, taste in enumerate(TASTE_KEYS):
        anchor_vec = anchor_vectors[taste]
        projections[:, i] = np.dot(normalized_vectors, anchor_vec)

    # Normalize sensory scores min-max across the dataset
    min_scores = np.min(projections, axis=0)
    max_scores = np.max(projections, axis=0)
    denoms = max_scores - min_scores
    denoms = np.where(denoms > 0, denoms, 1.0)

    sensory_scores = (projections - min_scores) / denoms
    # Apply exponential sensory contrast scale
    sensory_scores = np.power(sensory_scores, 1.6)

    # 3. Fit UMAP for beautiful non-linear 3D clustering
    print("Fitting UMAP (3D projection, cosine metric)... This will take 1-3 seconds...")
    reducer = umap.UMAP(
        n_components=3,
        n_neighbors=15,
        min_dist=0.15,
        metric='cosine',
        random_state=42
    )
    embedding = reducer.fit_transform(normalized_vectors)
    print("UMAP fitting completed successfully.")

    # Normalize UMAP coordinates to [-1.0, 1.0] range
    max_val = np.max(np.abs(embedding))
    if max_val > 0:
        embedding = embedding / max_val

    # 4. Generate metadata list and save public/ingredients.json
    ingredients_list = []
    for idx in range(len(df)):
        # Format name cleanly: replace underscores and capitalize
        clean_name = raw_names[idx].replace('_', ' ')
        clean_name = ' '.join(word.capitalize() for word in clean_name.split())
        
        sensory = [round(float(s), 3) for s in sensory_scores[idx]]
        coords = [round(float(c), 4) for c in embedding[idx]]
        
        ingredients_list.append({
            "name": clean_name,
            "sensory": sensory,
            "coords": coords
        })

    with open(json_path, 'w') as f:
        json.dump(ingredients_list, f, indent=2)
    print(f"Successfully generated metadata containing {len(ingredients_list)} items at: {json_path}")

    # 5. Save data/dataset.bin as flat binary floats
    with open(bin_path, 'wb') as f:
        f.write(normalized_vectors.tobytes())
    print(f"Successfully generated flat dataset binary containing {len(df)} vectors of {dim_count} dimensions at: {bin_path}")

if __name__ == "__main__":
    main()
