import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

load_dotenv()

def create_tables():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Levi170404!',
            database='smarttask_db',
            port=3306
        )
        cursor = connection.cursor()

        # Exemplo: criar tabela 'tasks'
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Tabela 'tasks' criada com sucesso!")

        # Adicione outras tabelas conforme necessário

    except Error as e:
        print(f"Erro ao criar tabelas: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
    return True