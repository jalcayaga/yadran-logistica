import pandas as pd
import json

file_path = '/home/astrodev/Desktop/logistica-yadran/public/Trazabilidad Estructuras CY.xlsx'
try:
    df = pd.read_excel(file_path)
    # Get column names and first 5 rows
    result = {
        "columns": df.columns.tolist(),
        "sample": df.head(5).to_dict(orient='records')
    }
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
