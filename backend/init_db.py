import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# Carregar .env
load_dotenv()

def create_database():
    try:
        # Conectar ao MySQL
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Levi170404!',  # Sem senha como configurado
            port=3306
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Criar database
            cursor.execute("CREATE DATABASE IF NOT EXISTS smarttask_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("Database 'smarttask_db' criado com sucesso!")
            
    except Error as e:
        print(f"Erro: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
    
    return True

def create_tables():
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from database import create_tables as create_sqlalchemy_tables
        create_sqlalchemy_tables()
        print("Tabelas criadas com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        return False

if __name__ == "__main__":
    print("Criando banco de dados...")
    
    if create_database():
        print("Criando tabelas...")
        create_tables()
        print("Pronto! Banco configurado.")
    else:
        print("Erro ao criar banco.")

