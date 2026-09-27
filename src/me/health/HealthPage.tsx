import React, { useState, useEffect } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Award
} from 'lucide-react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function HealthPage() {
  const { refreshKey, onRefresh } = useOutletContext<OutletContextType>();
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const activeSub = pathParts[3] || 'weight';

  const [activeTab, setActiveTab] = useState<'weight' | 'gym' | 'progress'>(
    (activeSub as any) || 'weight'
  );

  useEffect(() => {
    if (pathParts[3]) {
      setActiveTab(pathParts[3] as any);
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'weight' | 'gym' | 'progress') => {
    setActiveTab(tab);
    navigate(`/me/health/${tab}`);
  };

  const [weights, setWeights] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  // Weight form modal
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [inputWeightDate, setInputWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputWeightNotes, setInputWeightNotes] = useState('');

  // Workout form modal
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState('Push');
  const [workoutDuration, setWorkoutDuration] = useState('50');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exerciseItems, setExerciseItems] = useState([
    { name: 'Barbell Bench Press', sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 70 }, { reps: 6, weight: 75 }] }
  ]);

  const loadData = async () => {
    try {
      const [wRes, gymRes] = await Promise.all([
        meApi.getWeight(),
        meApi.getWorkouts()
      ]);
      setWeights(wRes);
      setWorkouts(gymRes);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load health data');
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleDeleteWeight = async (id: string) => {
    try {
      await meApi.deleteWeight(id);
      toast.success('Weight record deleted');
      setWeights(prev => prev.filter(w => w.id !== id));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    try {
      await meApi.deleteWorkout(id);
      toast.success('Workout deleted');
      setWorkouts(prev => prev.filter(w => w.id !== id));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete workout');
    }
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWeight) return;
    try {
      await meApi.createWeight({
        weight: parseFloat(inputWeight),
        date: inputWeightDate,
        notes: inputWeightNotes
      });
      toast.success(`Recorded ${inputWeight} kg`);
      setWeightModalOpen(false);
      setInputWeight('');
      setInputWeightNotes('');
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to save weight');
    }
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meApi.createWorkout({
        workoutType,
        duration: parseInt(workoutDuration) || 45,
        date: workoutDate,
        notes: workoutNotes,
        exercises: exerciseItems
      });
      toast.success(`${workoutType} workout logged`);
      setWorkoutModalOpen(false);
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to log workout');
    }
  };

  const currentWeight = weights.length > 0 ? weights[0].weight : null;
  const startingWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const totalChange = currentWeight && startingWeight ? Number((currentWeight - startingWeight).toFixed(1)) : 0;

  const personalRecords: Record<string, { weight: number; reps: number; date: string }> = {};
  workouts.forEach(w => {
    if (w.exercises) {
      w.exercises.forEach((ex: any) => {
        if (ex.sets) {
          ex.sets.forEach((set: any) => {
            const exName = ex.name.trim();
            if (!personalRecords[exName] || set.weight > personalRecords[exName].weight) {
              personalRecords[exName] = {
                weight: set.weight,
                reps: set.reps,
                date: w.date
              };
            }
          });
        }
      });
    }
  });

  return (
    <div className="flex flex-col w-full">
    <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline-border">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Health & Physical Performance</h2>
          <p className="font-body-sm text-body-sm text-text-secondary mt-0.5">
            Weight trendline, training log, personal records, and strength volume.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto scrollbar-none">
          {(['weight', 'gym', 'progress'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3.5 py-1 rounded-full font-label-md text-label-md capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              {tab === 'gym' ? 'Gym / Workouts' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface-card border border-hairline-border p-4 rounded-xl">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Current Weight</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {currentWeight ? `${currentWeight} kg` : '—'}
          </span>
        </div>
        <div className="bg-surface-card border border-hairline-border p-4 rounded-xl">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Starting Weight</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {startingWeight ? `${startingWeight} kg` : '—'}
          </span>
        </div>
        <div className="bg-surface-card border border-hairline-border p-4 rounded-xl">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Total Weight Shift</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-primary">
            {totalChange > 0 ? `+${totalChange}` : totalChange} kg
          </span>
        </div>
        <div className="bg-surface-card border border-hairline-border p-4 rounded-xl">
          <span className="font-code-sm text-[11px] text-text-tertiary block">Total Workouts Logged</span>
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {workouts.length} sessions
          </span>
        </div>
      </div>

      {activeTab === 'weight' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface-card border border-hairline-border p-4 rounded-xl">
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Weight History</h3>
              <span className="font-code-sm text-[11px] text-text-tertiary">Consistent morning fasted weigh-ins</span>
            </div>
            <button
              onClick={() => setWeightModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-accent-hover text-on-primary rounded-lg font-label-sm text-label-sm font-semibold transition-all shadow-xs"
            >
              <Plus size={14} /> Log Weight
            </button>
          </div>

          {weights.length > 0 ? (
            <div className="bg-surface-card border border-hairline-border rounded-xl border border-hairline-border overflow-hidden shadow-xs">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container-low border-b border-hairline-border font-label-sm text-label-sm text-text-tertiary uppercase">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Weight (kg)</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline text-on-surface">
                  {weights.map(w => (
                    <tr key={w.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3 font-code-sm text-[11px] text-text-tertiary font-normal">
                        {w.date}
                      </td>
                      <td className="px-4 py-3 font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {w.weight} kg
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{w.notes || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteWeight(w.id)}
                          className="p-1 rounded text-text-tertiary hover:text-error hover:bg-surface-container transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface-card border border-hairline-border p-12 text-center rounded-xl border border-hairline-border text-text-tertiary">
              <p className="font-body-md text-body-md mb-2">No weight data logged yet.</p>
              <button
                onClick={() => setWeightModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-semibold"
              >
                <Plus size={14} /> Record First Weigh-in
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gym' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-surface-card border border-hairline-border p-4 rounded-xl">
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Training Sessions</h3>
              <span className="font-code-sm text-[11px] text-text-tertiary">Resistance training, volume & set logging</span>
            </div>
            <button
              onClick={() => setWorkoutModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-accent-hover text-on-primary rounded-lg font-label-sm text-label-sm font-semibold transition-all shadow-xs"
            >
              <Plus size={14} /> Log Workout
            </button>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map(workout => (
                <div key={workout.id} className="bg-surface-card border border-hairline-border p-5 rounded-xl border border-hairline-border shadow-xs">
                  <div className="flex items-start justify-between pb-3 border-b border-hairline-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          {workout.workoutType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container font-code-sm text-[11px] text-text-secondary">
                          {workout.duration} mins
                        </span>
                      </div>
                      <span className="font-code-sm text-[11px] text-text-tertiary">
                        Date: {workout.date}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="p-1 rounded text-text-tertiary hover:text-error hover:bg-surface-container transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {workout.exercises && workout.exercises.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="font-label-sm text-label-sm text-text-tertiary uppercase">Exercises & Sets:</span>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {workout.exercises.map((ex: any, idx: number) => (
                          <div key={idx} className="bg-surface-container-low p-2.5 rounded-lg border border-hairline-border">
                            <span className="font-label-md text-label-md font-semibold text-on-surface block mb-1">
                              {ex.name}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ex.sets?.map((s: any, sIdx: number) => (
                                <span key={sIdx} className="font-code-sm text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-text-secondary">
                                  {s.weight}kg × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {workout.notes && (
                    <p className="mt-3 text-body-sm text-text-secondary font-normal italic">
                      "{workout.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-card border border-hairline-border p-12 text-center rounded-xl border border-hairline-border text-text-tertiary">
              <p className="font-body-md text-body-md mb-2">No gym workouts logged yet.</p>
              <button
                onClick={() => setWorkoutModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-semibold"
              >
                <Plus size={14} /> Log Your First Workout
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-surface-card border border-hairline-border p-6 rounded-2xl shadow-xs">
            <h3 className="font-title-md text-title-md font-semibold text-on-surface mb-1 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Personal Records (PRs)
            </h3>
            <p className="font-body-sm text-body-sm text-text-secondary mb-4">
              Heaviest sets tracked across all logged compound and isolation exercises.
            </p>

            {Object.keys(personalRecords).length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(personalRecords).map(([name, data]) => (
                  <div key={name} className="bg-surface-container-low p-4 rounded-xl border border-hairline-border">
                    <span className="font-label-md text-label-md font-semibold text-on-surface block truncate">
                      {name}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-headline-sm text-headline-sm font-semibold text-primary">
                        {data.weight} kg
                      </span>
                      <span className="font-code-sm text-[11px] text-text-secondary">
                        × {data.reps} reps
                      </span>
                    </div>
                    <span className="font-code-sm text-[10px] text-text-tertiary block mt-1">
                      Achieved on {data.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-text-tertiary font-body-sm text-body-sm">
                Log workouts with exercises and weights to automatically extract personal records.
              </div>
            )}
          </div>
        </div>
      )}

      {weightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-card border border-hairline-border border border-hairline-border rounded-2xl p-6 shadow-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Record Weight</h3>
            <form onSubmit={handleSaveWeight} className="space-y-4">
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Weight (kg)*</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 73.5"
                  value={inputWeight}
                  onChange={e => setInputWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface font-headline-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Date</label>
                <input
                  type="date"
                  value={inputWeightDate}
                  onChange={e => setInputWeightDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Fasted morning, post-run"
                  value={inputWeightNotes}
                  onChange={e => setInputWeightNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWeightModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl font-semibold"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-card border border-hairline-border border border-hairline-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Log Training Workout</h3>
            <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={e => setWorkoutType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                  >
                    {['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Cardio', 'Full Body', 'Other'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={workoutDuration}
                    onChange={e => setWorkoutDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Date</label>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={e => setWorkoutDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Exercise Highlights</label>
                {exerciseItems.map((ex, idx) => (
                  <div key={idx} className="bg-surface-container-low p-3 rounded-lg border border-hairline-border mb-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Barbell Squat)"
                      value={ex.name}
                      onChange={e => {
                        const copy = [...exerciseItems];
                        copy[idx].name = e.target.value;
                        setExerciseItems(copy);
                      }}
                      className="w-full px-2.5 py-1 bg-surface-container border border-hairline-border rounded text-on-surface font-semibold text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-[11px] text-text-tertiary">Sets:</span>
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1 font-code-sm text-xs">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={e => {
                              const copy = [...exerciseItems];
                              copy[idx].sets[sIdx].weight = parseFloat(e.target.value) || 0;
                              setExerciseItems(copy);
                            }}
                            className="w-14 px-1 py-0.5 bg-surface-container border border-hairline-border rounded text-center"
                            placeholder="kg"
                          />
                          <span>kg ×</span>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={e => {
                              const copy = [...exerciseItems];
                              copy[idx].sets[sIdx].reps = parseInt(e.target.value) || 0;
                              setExerciseItems(copy);
                            }}
                            className="w-12 px-1 py-0.5 bg-surface-container border border-hairline-border rounded text-center"
                            placeholder="reps"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExerciseItems([...exerciseItems, { name: '', sets: [{ reps: 10, weight: 50 }] }])}
                  className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus size={13} /> Add another exercise
                </button>
              </div>

              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Felt strong, new rep PR on second set"
                  value={workoutNotes}
                  onChange={e => setWorkoutNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl font-semibold"
                >
                  Log Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
