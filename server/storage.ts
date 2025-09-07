import { type User, type InsertUser, type Transaction, type InsertTransaction, type Balance, type InsertBalance, type UserCard, type InsertUserCard } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getBalance(): Promise<Balance>;
  updateBalance(balance: Partial<InsertBalance>): Promise<Balance>;
  
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  
  getUserCards(userId: string): Promise<UserCard[]>;
  createUserCard(card: InsertUserCard): Promise<UserCard>;
  deleteUserCard(cardId: string): Promise<boolean>;
  getUserCardById(cardId: string): Promise<UserCard | undefined>;
}

interface FileData {
  users: User[];
  transactions: Transaction[];
  balance: Balance;
  userCards: UserCard[];
}

export class MemStorage implements IStorage {
  private dataFile: string;
  private data: FileData;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'data.json');
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const fileContent = fs.readFileSync(this.dataFile, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = {
          users: [],
          transactions: [],
          balance: {
            id: randomUUID(),
            currentBalance: 0,
            totalAdded: 0,
            totalWithdrawn: 0,
            lastUpdated: new Date(),
          },
          userCards: []
        };
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = {
        users: [],
        transactions: [],
        balance: {
          id: randomUUID(),
          currentBalance: 0,
          totalAdded: 0,
          totalWithdrawn: 0,
          lastUpdated: new Date(),
        },
        userCards: []
      };
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  async getBalance(): Promise<Balance> {
    return this.data.balance;
  }

  async updateBalance(balanceUpdate: Partial<InsertBalance>): Promise<Balance> {
    this.data.balance = {
      ...this.data.balance,
      ...balanceUpdate,
      lastUpdated: new Date(),
    };
    this.saveData();
    return this.data.balance;
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.data.transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.data.transactions.push(transaction);
    this.saveData();
    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.data.transactions.find(transaction => transaction.id === id);
  }

  async getUserCards(userId: string): Promise<UserCard[]> {
    if (!this.data.userCards) {
      this.data.userCards = [];
      this.saveData();
    }
    return this.data.userCards.filter(card => card.userId === userId);
  }

  async createUserCard(insertCard: InsertUserCard): Promise<UserCard> {
    const id = randomUUID();
    const card: UserCard = {
      ...insertCard,
      id,
      createdAt: new Date(),
    };
    
    if (!this.data.userCards) {
      this.data.userCards = [];
    }
    
    this.data.userCards.push(card);
    this.saveData();
    return card;
  }

  async deleteUserCard(cardId: string): Promise<boolean> {
    if (!this.data.userCards) {
      return false;
    }
    
    const initialLength = this.data.userCards.length;
    this.data.userCards = this.data.userCards.filter(card => card.id !== cardId);
    
    if (this.data.userCards.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  async getUserCardById(cardId: string): Promise<UserCard | undefined> {
    if (!this.data.userCards) {
      return undefined;
    }
    return this.data.userCards.find(card => card.id === cardId);
  }
}

export const storage = new MemStorage();
