const keydb = require('../database/keydb');

const CACHE_TTL = 3600; 
const TASKS_LIST_KEY = 'tasks:all';

const getAllTasks = async () => {
    const cachedTasks = await keydb.get(TASKS_LIST_KEY);
    
    if (cachedTasks) {
        console.log('Cache hit: Retrieved tasks from cache');
        return JSON.parse(cachedTasks);
    }
    
    console.log('Cache miss: Fetching tasks from database');
    
    const taskKeys = await keydb.keys('task:*');
    let tasks = [];
    
    if (taskKeys.length > 0) {
        const pipeline = keydb.pipeline();
        taskKeys.forEach(key => pipeline.hgetall(key));
        const results = await pipeline.exec();
        tasks = results.map(result => result[1]);
        
        await keydb.set(TASKS_LIST_KEY, JSON.stringify(tasks), 'EX', CACHE_TTL);
    }
    
    return tasks;
}

const getTaskById = async (id) => {
    const cacheKey = `task:${id}:cached`;
    const cachedTask = await keydb.get(cacheKey);
    
    if (cachedTask) {
        console.log(`Cache hit: Retrieved task ${id} from cache`);
        return JSON.parse(cachedTask);
    }
    
    console.log(`Cache miss: Fetching task ${id} from database`);
    
    const task = await keydb.hgetall(`task:${id}`);
    
    if (task && Object.keys(task).length > 0) {
        await keydb.set(cacheKey, JSON.stringify(task), 'EX', CACHE_TTL);
    }
    
    return Object.keys(task).length > 0 ? task : null;
}

const createTask = async (task) => {
    const id = task.id || Date.now().toString();
    task.id = id;
    
    await keydb.hset(`task:${id}`, task);

    await keydb.del(TASKS_LIST_KEY);
    
    return task;
}

const updateTask = async (id, updatedTask) => {
    updatedTask.id = id; 

    await keydb.hset(`task:${id}`, updatedTask);
    await keydb.del(`task:${id}:cached`);
    await keydb.del(TASKS_LIST_KEY);
    
    return updatedTask;
}

const deleteTask = async (id) => {
    await keydb.del(`task:${id}`);
    
    await keydb.del(`task:${id}:cached`);
    await keydb.del(TASKS_LIST_KEY);
    
    return true;
}

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
}