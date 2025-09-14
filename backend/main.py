from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import mysql.connector
import os
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

app = FastAPI(title="Smart Task Manager API", version="1.0.0")

SECRET_KEY = "170404"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("sua_senha")
print(hashed)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Levi170404!',
        database='smarttask_db',
        port=3306
    )

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user["password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    status: str = "pending"   # pending, in_progress, completed
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None



@app.get("/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user)):
    """Listar todas as tarefas do usuário autenticado"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Assumindo que existe user_id na tabela - ajuste se necessário
    cursor.execute("""
        SELECT id, title, description, status, created_at 
        FROM tasks 
        WHERE user_id = %s 
        ORDER BY created_at DESC
    """, (current_user["id"],))

    tasks = cursor.fetchall()
    cursor.close()
    conn.close()

    return {"tasks": tasks}


@app.post("/tasks")
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    """Criar uma nova tarefa"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO tasks (title, description, status, user_id, created_at)
        VALUES (%s, %s, %s, %s, NOW())
    """, (
        task.title,
        task.description,
        task.status,
        current_user["id"]
    ))
    
    task_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Tarefa criada com sucesso", "task_id": task_id}

@app.put("/tasks/{task_id}")
async def update_task(task_id: int, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    """Atualizar uma tarefa"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar se a tarefa existe e pertence ao usuário
    cursor.execute("SELECT id FROM tasks WHERE id = %s AND user_id = %s", (task_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Construir query de atualização
    update_fields = []
    update_values = []
    
    if task_update.title is not None:
        update_fields.append("title = %s")
        update_values.append(task_update.title)
    
    if task_update.description is not None:
        update_fields.append("description = %s")
        update_values.append(task_update.description)
    
    if task_update.status is not None:
        update_fields.append("status = %s")
        update_values.append(task_update.status)
    
    if update_fields:
        update_values.append(task_id)
        query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, update_values)
        conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"message": "Tarefa atualizada com sucesso"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Deletar uma tarefa"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": "Tarefa deletada com sucesso"}

@app.get("/tasks/stats")
async def get_task_stats(current_user: dict = Depends(get_current_user)):
    """Estatísticas das tarefas"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
        FROM tasks
    """)
    
    stats = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return stats

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Olá, {current_user['username']}! Você está autenticado."}

@app.get("/")
async def root():
    return {"message": "Smart Task Manager API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
