import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { RoomTodo } from '../../types/database';
import { ListTodo, Plus, Check, Trash2 } from 'lucide-react';

interface Props {
    roomId: string;
}

export default function TodoList({ roomId }: Props) {
    const { profile } = useAuthStore();
    const [todos, setTodos] = useState<RoomTodo[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadTodos();
    }, [roomId]);

    const loadTodos = async () => {
        const { data } = await supabase
            .from('room_todos')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });
        if (data) setTodos(data as RoomTodo[]);
    };

    const addTodo = async () => {
        if (!profile || !newTodo.trim()) return;
        setAdding(true);
        const { data } = await supabase
            .from('room_todos')
            .insert({ room_id: roomId, user_id: profile.id, text: newTodo.trim() })
            .select()
            .single();
        if (data) setTodos([...todos, data as RoomTodo]);
        setNewTodo('');
        setAdding(false);
    };

    const toggleTodo = async (todo: RoomTodo) => {
        await supabase
            .from('room_todos')
            .update({ is_completed: !todo.is_completed })
            .eq('id', todo.id);
        setTodos(todos.map((t) => (t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t)));
    };

    const deleteTodo = async (id: string) => {
        await supabase.from('room_todos').delete().eq('id', id);
        setTodos(todos.filter((t) => t.id !== id));
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ListTodo style={{ width: 18, height: 18, color: '#f97316' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
                    Study Goals
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                    ({todos.filter((t) => t.is_completed).length}/{todos.length} done)
                </span>
            </div>

            {/* Add Todo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                    className="input"
                    placeholder="Add a study goal..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                    style={{ fontSize: 13 }}
                />
                <button className="btn btn-primary btn-sm" onClick={addTodo} disabled={!newTodo.trim() || adding}>
                    <Plus style={{ width: 14, height: 14 }} />
                </button>
            </div>

            {/* Todo Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todos.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 16 }}>
                        No goals yet. Add one to track your progress!
                    </p>
                ) : (
                    todos.map((todo) => (
                        <div
                            key={todo.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <button
                                onClick={() => toggleTodo(todo)}
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    border: '2px solid',
                                    borderColor: todo.is_completed ? '#10b981' : 'rgba(255,255,255,0.2)',
                                    background: todo.is_completed ? '#10b981' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {todo.is_completed && <Check style={{ width: 12, height: 12, color: 'white' }} />}
                            </button>
                            <span
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    color: todo.is_completed ? '#64748b' : '#e2e8f0',
                                    textDecoration: todo.is_completed ? 'line-through' : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {todo.text}
                            </span>
                            {profile?.id === todo.user_id && (
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 2,
                                        opacity: 0.5,
                                    }}
                                >
                                    <Trash2 style={{ width: 14, height: 14, color: '#ef4444' }} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
