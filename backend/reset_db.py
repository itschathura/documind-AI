import os
import sys

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, Base
from app.models.document import Document

def reset_db():
    print("Dropping existing documents table...")
    # This will drop the documents table since it's registered via Base
    Base.metadata.drop_all(bind=engine)
    
    print("Recreating tables with new schema (UUID)...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    reset_db()
