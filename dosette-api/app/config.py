import os

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/dosette_db")
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))