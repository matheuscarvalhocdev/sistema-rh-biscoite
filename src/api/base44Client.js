const DB_KEY = "rh_system_db_v1";
const LOGS_KEY = "rh_system_logs"; 

const logAction = (action, entity, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
    const currentUser = JSON.parse(localStorage.getItem("rh_user") || "{}");
    const newLog = {
      id: Date.now(),
      user: currentUser.name || "Usuário Sistema",
      action, entity, detail,
      time: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) { console.error(e); }
};

const delay = () => new Promise(resolve => setTimeout(resolve, 500));
const getDB = () => JSON.parse(localStorage.getItem(DB_KEY) || '{"employees":[], "units":[], "users":[]}');
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

export const base44 = {
  entities: {
    Employee: {
      list: async () => { await delay(); return getDB().employees || []; },
      create: async (data) => {
        await delay();
        const db = getDB();
        const newEmp = { ...data, id: Date.now() };
        if (!db.employees) db.employees = [];
        db.employees.push(newEmp);
        saveDB(db);
        logAction("CREATE", "FUNCIONARIO", `Contratou ${newEmp.name}`);
        return newEmp;
      },
      update: async (id, data) => {
        await delay();
        const db = getDB();
        const index = db.employees.findIndex(e => e.id === id);
        if (index !== -1) {
            db.employees[index] = { ...db.employees[index], ...data };
            saveDB(db);
            logAction("UPDATE", "FUNCIONARIO", `Atualizou ${data.name}`);
        }
      },
      delete: async (id) => {
        await delay();
        const db = getDB();
        db.employees = db.employees.filter(e => e.id !== id);
        saveDB(db);
      }
    },

    Unit: {
      list: async () => { await delay(); return getDB().units || []; },
      create: async (data) => {
        await delay();
        const db = getDB();
        const newUnit = { ...data, id: Date.now() };
        if (!db.units) db.units = [];
        db.units.push(newUnit);
        saveDB(db);
        return newUnit;
      },
      // 👇 NOVA FUNÇÃO: SALVAR VÁRIOS DE UMA VEZ
      createMany: async (items) => {
        await delay();
        const db = getDB();
        if (!db.units) db.units = [];
        
        const newUnits = items.map((item, index) => ({
            ...item,
            id: Date.now() + index // Garante ID único para cada um
        }));
        
        db.units.push(...newUnits);
        saveDB(db);
        logAction("IMPORT", "UNIDADE", `Importou ${items.length} unidades via Excel`);
        return newUnits;
      },
      update: async (id, data) => {
        await delay();
        const db = getDB();
        const index = db.units.findIndex(u => u.id === id);
        if (index !== -1) {
            db.units[index] = { ...db.units[index], ...data };
            saveDB(db);
        }
      },
      delete: async (id) => {
        await delay();
        const db = getDB();
        db.units = db.units.filter(u => u.id !== id);
        saveDB(db);
      }
    },

    User: {
      list: async () => {
        await delay();
        const db = getDB();
        if (!db.users || db.users.length === 0) {
           db.users = [{ id: 999, name: "Admin", email: "admin@rh.com", role: "ADMIN_SISTEMA" }];
           saveDB(db);
        }
        return db.users;
      },
      create: async (data) => {
        await delay();
        const db = getDB();
        const newUser = { ...data, id: Date.now() };
        if (!db.users) db.users = [];
        db.users.push(newUser);
        saveDB(db);
      },
      delete: async (id) => {
         await delay();
         const db = getDB();
         db.users = db.users.filter(u => u.id !== id);
         saveDB(db);
      }
    },
    
    Job: {
      list: async () => { await delay(); return getDB().jobs || []; },
      create: async (data) => {
        await delay();
        const db = getDB();
        const newJob = { ...data, id: Date.now() };
        if (!db.jobs) db.jobs = [];
        db.jobs.push(newJob);
        saveDB(db);
        logAction("CREATE", "VAGA", `Abriu vaga para ${newJob.title}`);
        return newJob;
      },
      update: async (id, data) => {
        await delay();
        const db = getDB();
        const index = (db.jobs || []).findIndex(j => j.id === id);
        if (index !== -1) {
            db.jobs[index] = { ...db.jobs[index], ...data };
            saveDB(db);
        }
      },
      delete: async (id) => {
        await delay();
        const db = getDB();
        if(db.jobs) {
            db.jobs = db.jobs.filter(j => j.id !== id);
            saveDB(db);
        }
      }
    }




  }
};