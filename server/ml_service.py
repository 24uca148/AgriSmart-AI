import sys
import json
import os
import random
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier
import pickle

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "rf_classifier.pkl")
REGRESSOR_PATH = os.path.join(MODEL_DIR, "rf_regressor.pkl")
PEST_DT_PATH = os.path.join(MODEL_DIR, "dt_classifier.pkl")

def get_irrigation_guidance(humidity, rainfall):
    if rainfall > 100:
        return "No irrigation needed. High rainfall detected."
    elif humidity > 70 and rainfall > 50:
        return "Minimal irrigation required."
    elif humidity < 40 and rainfall < 30:
        return "Heavy irrigation required. Very dry conditions."
    else:
        return "Moderate irrigation recommended."

def generate_synthetic_data():
    np.random.seed(42)
    random.seed(42)
    
    n_samples = 200
    
    data = {
        'n': np.random.uniform(0, 100, n_samples),
        'p': np.random.uniform(0, 100, n_samples),
        'k': np.random.uniform(0, 100, n_samples),
        'ph': np.random.uniform(5.0, 8.5, n_samples),
        'temperature': np.random.uniform(15, 35, n_samples),
        'humidity': np.random.uniform(30, 90, n_samples),
        'rainfall': np.random.uniform(20, 200, n_samples),
        'historical_pests': np.random.randint(0, 10, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Synthetic outputs
    crops = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean']
    df['crop'] = np.random.choice(crops, n_samples)
    
    # Yield loosely based on N, P, K, rain
    df['yield'] = (df['n'] * 0.3 + df['p'] * 0.2 + df['k'] * 0.2 + df['rainfall'] * 0.1) * np.random.uniform(0.8, 1.2, n_samples)
    
    # Pest risk loosely based on historical pests and humidity
    conditions = [
        (df['historical_pests'] > 6) | (df['humidity'] > 75),
        (df['historical_pests'] > 3) | (df['humidity'] > 50),
        (df['historical_pests'] <= 3)
    ]
    choices = ['High', 'Medium', 'Low']
    df['pest_risk'] = np.select(conditions, choices, default='Low')
    
    # Train models
    X = df[['n', 'p', 'k', 'ph', 'temperature', 'humidity', 'rainfall', 'historical_pests']]
    
    rf_clf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf_clf.fit(X, df['crop'])
    
    rf_reg = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_reg.fit(X, df['yield'])
    
    dt_clf = DecisionTreeClassifier(random_state=42)
    dt_clf.fit(X, df['pest_risk'])
    
    with open(CLASSIFIER_PATH, 'wb') as f:
        pickle.dump(rf_clf, f)
    with open(REGRESSOR_PATH, 'wb') as f:
        pickle.dump(rf_reg, f)
    with open(PEST_DT_PATH, 'wb') as f:
        pickle.dump(dt_clf, f)
        
    # Also save the data
    df.to_csv(os.path.join(MODEL_DIR, "synthetic_data.csv"), index=False)

def predict(input_json):
    try:
        data = json.loads(input_json)
        
        if not os.path.exists(CLASSIFIER_PATH):
            generate_synthetic_data()
            
        with open(CLASSIFIER_PATH, 'rb') as f:
            rf_clf = pickle.load(f)
        with open(REGRESSOR_PATH, 'rb') as f:
            rf_reg = pickle.load(f)
        with open(PEST_DT_PATH, 'rb') as f:
            dt_clf = pickle.load(f)
            
        features = [[
            data['n'], data['p'], data['k'], data['ph'], 
            data['temperature'], data['humidity'], data['rainfall'], 
            data['historicalPests']
        ]]
        
        crop_rec = rf_clf.predict(features)[0]
        yield_pred = rf_reg.predict(features)[0]
        pest_risk = dt_clf.predict(features)[0]
        
        irrigation_guidance = get_irrigation_guidance(data['humidity'], data['rainfall'])
        
        result = {
            "cropRecommendation": str(crop_rec),
            "yieldPrediction": round(float(yield_pred), 2),
            "pestRisk": str(pest_risk),
            "irrigationGuidance": irrigation_guidance
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    cmd = sys.argv[1]
    if cmd == "--generate":
        generate_synthetic_data()
        print(json.dumps({"status": "success"}))
    elif cmd == "--predict" and len(sys.argv) > 2:
        predict(sys.argv[2])
