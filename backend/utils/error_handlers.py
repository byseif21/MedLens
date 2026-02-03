from fastapi import HTTPException
from contextlib import asynccontextmanager
from functools import wraps
from typing import Optional, Callable, Any

@asynccontextmanager
async def service_error_handler(error_message: str = "Operation failed"):
    """
    Context manager for handling service errors in a standardized way.
    
    Usage:
        async with service_error_handler("Custom error message"):
            result = await service.some_method()
            
    Raises:
        HTTPException: Re-raises existing HTTPExceptions or creates a new 500 error for other exceptions.
    """
    try:
        yield
    except Exception as e:
        _handle_exception(e, error_message)

def handle_service_errors(error_message: str = "Operation failed"):
    """
    Decorator for handling service errors.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                _handle_exception(e, error_message)
        return wrapper
    return decorator

def _handle_exception(e: Exception, error_message: str):
    """Shared exception handling logic"""
    if isinstance(e, HTTPException):
        raise e
    
    # Keep original error message if it's already descriptive enough, otherwise prepend context
    detail = str(e)
    if error_message and error_message not in detail:
        detail = f"{error_message}: {detail}"
    raise HTTPException(status_code=500, detail=detail)
