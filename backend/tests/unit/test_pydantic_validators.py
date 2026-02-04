
from pydantic import BaseModel, field_validator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_pass_behavior():
    print("\n--- Testing 'pass' behavior ---")
    try:
        raise ValueError("Simulated error")
    except ValueError:
        print("Caught error, logging warning...")
        # pass # This was the removed line
    
    print("Code continued execution successfully after catch block.")
    return True

def test_pydantic_validators():
    print("\n--- Testing Pydantic Validators ---")
    
    # Case 1: Without @classmethod (The original state)
    print("1. Defining Model WITHOUT @classmethod...")
    try:
        class ModelWithoutDecorator(BaseModel):
            name: str

            @field_validator('name')
            def validate_name(cls, v):
                # If this is called, does 'cls' actually exist?
                print(f"   Inside validator (No Decorator). cls type: {type(cls)}")
                return v.upper()
        
        m1 = ModelWithoutDecorator(name="test")
        print(f"   Result: {m1.name}")
    except Exception as e:
        print(f"   FAILED: {e}")

    # Case 2: With @classmethod (The fix)
    print("\n2. Defining Model WITH @classmethod...")
    try:
        class ModelWithDecorator(BaseModel):
            name: str

            @field_validator('name')
            @classmethod
            def validate_name(cls, v):
                print(f"   Inside validator (With Decorator). cls type: {type(cls)}")
                return v.upper()

        m2 = ModelWithDecorator(name="test")
        print(f"   Result: {m2.name}")
    except Exception as e:
        print(f"   FAILED: {e}")

if __name__ == "__main__":
    test_pass_behavior()
    test_pydantic_validators()
