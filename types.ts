import React from 'react';

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number; // For low stock alerts
  price: number;
  description: string;
  lastUpdated: string;
}

// Shoes Management Types
export interface Shoe {
  id: number;
  name: string;
  quantity: number;
}

export interface Subcategory {
  id: number;
  name: string;
}

export interface SubShoe {
  id: number;
  shoes_id: number;
  subcategory_id: number;
  quantity: number;
  subcategory_name: string; // Joined from DB
}

export interface StockItem {
  id: number; // subcategory_id
  name: string;
  quantity: number;
}

export interface ProductionRecord {
  name: string; // shoe_name or subcategory_name
  total_quantity: number;
}

export interface DispatchRecord {
  id: number;
  order_id: string;
  shoe_name: string;
  customer_name: string;
  quantity: number;
  price: number;
  date: string;
}

// Employee & Payroll Types
export interface Employee {
  id: number;
  name: string;
  role: string;
  contact: string;
  daily_rate: number;
  balance?: number; // Calculated: Total Work - Total Paid
}

export interface WorkLog {
  id: number;
  employee_id: number;
  date: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: number;
  employee_id: number;
  date: string;
  amount: number;
  note: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  IMPORT_DATA = 'IMPORT_DATA', 
  PRODUCTION = 'PRODUCTION', 
  DISPATCH = 'DISPATCH',
  SHOES_MANAGEMENT = 'SHOES_MANAGEMENT',
  EMPLOYEES = 'EMPLOYEES', // New
  INVENTORY = 'INVENTORY',
  AI_INSIGHTS = 'AI_INSIGHTS',
  SETTINGS = 'SETTINGS'
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}