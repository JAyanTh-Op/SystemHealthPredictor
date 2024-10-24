import psutil
from flask import Flask, jsonify
import joblib
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
#
# Load the trained model and scaler
model = joblib.load('xgboost_model.pkl')
scaler = joblib.load('scaler.pkl')

# Define the expected feature columns used during training
expected_features = ['cpu_usage_percent', 'ram_usage_percent', 'disk_usage_C', 'disk_usage_D', 'disk_usage_E']
def get_disk_usage(path='/'):
    """Get disk usage statistics for a given path."""
    try:
        usage = psutil.disk_usage(path)
        return {
            'total': usage.total / (1024 ** 3),  # Total disk space in GB
            'used': usage.used / (1024 ** 3),    # Used disk space in GB
            'free': usage.free / (1024 ** 3),    # Free disk space in GB
            'percent': usage.percent             # Percent used
        }
    except Exception as e:
        print(f"Error accessing disk usage for {path}: {str(e)}")
        return {
            'total': 0,
            'used': 0,
            'free': 0,
            'percent': 0
        }

def get_system_metrics():
    """Collect system metrics including CPU, memory, and disk usage."""
    metrics = {}
    
    # Get average CPU usage across all cores
    metrics['cpu_usage_percent'] = psutil.cpu_percent(interval=1)  # This already gives the average CPU usage
    
    # Get available memory in MB
    virtual_mem = psutil.virtual_memory()
    metrics['ram_usage_percent'] = virtual_mem.percent
    
    # Get disk usage percentages for specific disk paths (example paths)
    for path in ['C:', 'D:', 'E:']:
        usage = get_disk_usage(path)
        metrics[f'disk_usage_{path}'] = usage['percent']
    
    return metrics

@app.route('/predict', methods=['GET'])
def predict_system_health():
    """Predict system health based on metrics and return as JSON response."""
    try:
        live_data = get_system_metrics()
        
        # Create DataFrame with the exact feature columns used during training
        df = pd.DataFrame([live_data], columns=expected_features)
        
        # Handle missing columns by setting default values
        for col in expected_features:
            if col not in df.columns:
                df[col] = 0
        
        # Ensure columns order matches the model's expected input
        df = df[expected_features]
        
        live_data_scaled = scaler.transform(df)
        prediction = model.predict(live_data_scaled)
        system_status = 'good' if prediction[0] == 1 else 'bad'
        
        response = {
            "system_health": system_status,
            "cpu_usage_percent": live_data['cpu_usage_percent'],
            "ram_usage_percent": live_data['ram_usage_percent'],
            "disk_usage_C:": live_data['disk_usage_C:'],
            "disk_usage_D:": live_data['disk_usage_D:'],
            "disk_usage_E:": live_data['disk_usage_E:']
        }
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
