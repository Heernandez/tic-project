# backend/create_admin.py
from app.db import SessionLocal
from app.models import SystemUser
from app.security import hash_password

def main():
    db = SessionLocal()

    username = "lhernandez"
    raw_password = "admin123"
    name = "Luis Hernandez"

    user = SystemUser(
        name=name,
        username=username,
        password_hash=hash_password(raw_password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"Usuario creado: {user.username} (id={user.id})")

if __name__ == "__main__":
    main()
