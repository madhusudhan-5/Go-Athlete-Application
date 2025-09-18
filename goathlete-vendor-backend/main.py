from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import random
import string
from jose import jwt
import os
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Database setup (PostgreSQL by default)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/goathlete")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

# FastAPI app
app = FastAPI(title="Go Athlete Vendor API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    auth_provider = Column(String, default="email")  # email, google, apple
    provider_id = Column(String, nullable=True)  # Google/Apple user ID

class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    auth_provider: str = "email"
    provider_id: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str]
    is_verified: bool
    is_active: bool
    auth_provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    is_new_user: bool

class SocialAuthRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    provider_id: str
    auth_provider: str  # google or apple

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# OTP generation
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Email sending function (you'll need to configure SMTP)
def send_otp_email(email: str, otp: str):
    # This is a placeholder - configure with your SMTP settings
    try:
        # Configure your SMTP settings here
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = email
        msg['Subject'] = "Go Athlete - OTP Verification"
        
        body = f"""
        Your OTP for Go Athlete verification is: {otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this OTP, please ignore this email.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Go Athlete Vendor API"}

@app.post("/auth/send-otp", response_model=dict)
async def send_otp(otp_request: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to email"""
    email = otp_request.email.lower()
    
    # Generate OTP (use fixed OTP in development for test account)
    if ENVIRONMENT == "development" and email == "test@goathlete.dev":
        otp_code = "123456"
    else:
        otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Store OTP in database
    db_otp = OTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.add(db_otp)
    db.commit()
    
    # Send email unless dev backdoor
    if not (ENVIRONMENT == "development" and email == "test@goathlete.dev"):
        email_sent = send_otp_email(email, otp_code)
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
    
    return {"message": "OTP sent successfully", "email": email}

@app.post("/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(otp_verify: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and authenticate user"""
    email = otp_verify.email.lower()
    otp_code = otp_verify.otp_code
    
    # Dev backdoor: allow fixed OTP for test account
    if not (ENVIRONMENT == "development" and email == "test@goathlete.dev" and otp_code == "123456"):
        # Find valid OTP
        db_otp = db.query(OTP).filter(
            OTP.email == email,
            OTP.otp_code == otp_code,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow()
        ).first()
        
        if not db_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Mark OTP as used
        db_otp.is_used = True
        db.commit()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    is_new_user = False
    
    if not user:
        # Create new user
        user = User(
            email=email,
            is_verified=True,
            auth_provider="email"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        # Update existing user
        user.is_verified = True
        db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user),
        is_new_user=is_new_user
    )

@app.post("/auth/social-login", response_model=AuthResponse)
async def social_login(social_auth: SocialAuthRequest, db: Session = Depends(get_db)):
    """Handle Google/Apple social login"""
    email = social_auth.email.lower()
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    is_new_user = False
    
    if not user:
        # Create new user
        user = User(
            email=email,
            name=social_auth.name,
            is_verified=True,
            auth_provider=social_auth.auth_provider,
            provider_id=social_auth.provider_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        # Update existing user if needed
        if not user.is_verified:
            user.is_verified = True
        if user.auth_provider != social_auth.auth_provider:
            user.auth_provider = social_auth.auth_provider
        if user.provider_id != social_auth.provider_id:
            user.provider_id = social_auth.provider_id
        db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user),
        is_new_user=is_new_user
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(
    token_data: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)

@app.post("/auth/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Logged out successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
