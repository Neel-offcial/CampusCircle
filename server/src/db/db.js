import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config/index.js';

const DB_FILE = path.join(CONFIG.DATA_DIR, 'db.json');

const INITIAL_SCHEMA = {
  users: [],
  groups: [],
  memberships: [],
  messages: [],
  assignments: [],
  announcements: [],
  confessions: [],
  personalCompletions: [],
  attendanceRecords: [],
  gpaProfiles: [],
  crApplications: [],
  academicDocuments: [],
  examSchedules: []
};

class JSONDatabase {
  constructor() {
    this.data = { ...INITIAL_SCHEMA };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(CONFIG.DATA_DIR)) {
        fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...INITIAL_SCHEMA, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Failed to load db.json, using in-memory state:', err);
      this.data = { ...INITIAL_SCHEMA };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing to db.json:', err);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  matchesFilter(item, filter = {}) {
    for (const [key, val] of Object.entries(filter)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('$in' in val) {
          if (!val.$in.includes(item[key])) return false;
        } else if ('$nin' in val) {
          if (val.$nin.includes(item[key])) return false;
        } else if ('$ne' in val) {
          if (item[key] === val.$ne) return false;
        } else if ('$regex' in val) {
          const reg = new RegExp(val.$regex, val.$options || 'i');
          if (!reg.test(String(item[key] || ''))) return false;
        } else if ('$gt' in val) {
          if (!(item[key] > val.$gt)) return false;
        } else if ('$gte' in val) {
          if (!(item[key] >= val.$gte)) return false;
        } else if ('$lt' in val) {
          if (!(item[key] < val.$lt)) return false;
        } else if ('$lte' in val) {
          if (!(item[key] <= val.$lte)) return false;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  find(collectionName, filter = {}, options = {}) {
    const col = this.getCollection(collectionName);
    let results = col.filter(item => this.matchesFilter(item, filter));

    if (options.sort) {
      const [sortField, sortOrder] = Object.entries(options.sort)[0] || [];
      if (sortField) {
        results.sort((a, b) => {
          const va = a[sortField];
          const vb = b[sortField];
          if (va < vb) return sortOrder === -1 ? 1 : -1;
          if (va > vb) return sortOrder === -1 ? -1 : 1;
          return 0;
        });
      }
    }

    if (options.skip) {
      results = results.slice(options.skip);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return JSON.parse(JSON.stringify(results));
  }

  findOne(collectionName, filter = {}) {
    const col = this.getCollection(collectionName);
    const item = col.find(item => this.matchesFilter(item, filter));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, { _id: id });
  }

  insertOne(collectionName, item) {
    const col = this.getCollection(collectionName);
    const doc = {
      _id: item._id || uuidv4(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      ...item
    };
    col.push(doc);
    this.save();
    return JSON.parse(JSON.stringify(doc));
  }

  insertMany(collectionName, items = []) {
    const col = this.getCollection(collectionName);
    const created = items.map(item => ({
      _id: item._id || uuidv4(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      ...item
    }));
    col.push(...created);
    this.save();
    return JSON.parse(JSON.stringify(created));
  }

  updateOne(collectionName, filter = {}, update = {}) {
    const col = this.getCollection(collectionName);
    const idx = col.findIndex(item => this.matchesFilter(item, filter));
    if (idx === -1) return null;

    const current = col[idx];
    const updated = {
      ...current,
      ...update,
      _id: current._id, // preserve id
      updatedAt: new Date().toISOString()
    };
    col[idx] = updated;
    this.save();
    return JSON.parse(JSON.stringify(updated));
  }

  updateById(collectionName, id, update = {}) {
    return this.updateOne(collectionName, { _id: id }, update);
  }

  deleteOne(collectionName, filter = {}) {
    const col = this.getCollection(collectionName);
    const idx = col.findIndex(item => this.matchesFilter(item, filter));
    if (idx === -1) return false;

    col.splice(idx, 1);
    this.save();
    return true;
  }

  deleteById(collectionName, id) {
    return this.deleteOne(collectionName, { _id: id });
  }

  deleteMany(collectionName, filter = {}) {
    const col = this.getCollection(collectionName);
    const initialLen = col.length;
    this.data[collectionName] = col.filter(item => !this.matchesFilter(item, filter));
    this.save();
    return initialLen - this.data[collectionName].length;
  }

  countDocuments(collectionName, filter = {}) {
    return this.find(collectionName, filter).length;
  }
}

export const db = new JSONDatabase();
