#!/usr/bin/env python3
"""
Setup script for Go Athlete Vendor Backend
This script helps set up the development environment
"""

import os
import sys
import subprocess
import shutil

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    if not os.path.exists("venv"):
        if not run_command("python -m venv venv", "Creating virtual environment"):
            return False
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        activate_script = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
    
    print(f"📝 To activate the virtual environment, run: {activate_script}")
    return True

def install_dependencies():
    """Install Python dependencies"""
    pip_command = "venv/bin/pip" if os.name != 'nt' else "venv\\Scripts\\pip"
    return run_command(f"{pip_command} install -r requirements.txt", "Installing dependencies")

def setup_environment_file():
    """Create .env file from template"""
    if not os.path.exists(".env"):
        if os.path.exists("env.example"):
            shutil.copy("env.example", ".env")
            print("✅ Created .env file from template")
            print("📝 Please update the .env file with your actual configuration")
        else:
            print("⚠️  env.example not found, please create .env file manually")
    else:
        print("✅ .env file already exists")
    return True

def setup_database():
    """Provide database setup instructions"""
    print("\n🗄️  Database Setup Instructions:")
    print("1. Install PostgreSQL on your system")
    print("2. Create a database named 'goathlete_vendor'")
    print("3. Update the DATABASE_URL in your .env file")
    print("4. Example: postgresql://username:password@localhost:5432/goathlete_vendor")
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up Go Athlete Vendor Backend...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    if not setup_virtual_environment():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup environment file
    setup_environment_file()
    
    # Database setup instructions
    setup_database()
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Update your .env file with proper configuration")
    print("2. Set up PostgreSQL database")
    print("3. Activate virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("4. Run the application:")
    print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\n🌐 API will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
