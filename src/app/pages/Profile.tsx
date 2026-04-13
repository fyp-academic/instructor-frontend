import React, { useState } from 'react';
import { User, Mail, MapPin, Building, Globe, Calendar, BookOpen, Edit, Save, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { currentUser, courses } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    bio: currentUser.bio,
    department: currentUser.department,
    institution: currentUser.institution,
    country: currentUser.country,
    timezone: currentUser.timezone,
    language: currentUser.language,
  });

  const myCourses = courses.filter(c => c.instructorId === currentUser.id);

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ icon: Icon, label, value, editKey }: { icon: React.ElementType; label: string; value: string; editKey?: keyof typeof form }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        {editing && editKey ? (
          editKey === 'bio' ? (
            <textarea
              value={form[editKey]}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              rows={3}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          ) : (
            <input
              type="text"
              value={form[editKey] as string}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
              className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )
        ) : (
          <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
          ✓ Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto">
                {currentUser.initials}
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <h2 className="mt-4 font-bold text-gray-900 text-lg">{editing ? form.name : currentUser.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{currentUser.email}</p>
            <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">
              {currentUser.role}
            </span>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Courses</span>
                <span className="font-semibold text-gray-800">{myCourses.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Students</span>
                <span className="font-semibold text-gray-800">{myCourses.reduce((s, c) => s + c.enrolledStudents, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-semibold text-gray-800">{new Date(currentUser.joinDate).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white mt-4">
            <h3 className="font-semibold mb-3">This Month</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Activities Added', value: '23' },
                { label: 'Students Graded', value: '67' },
                { label: 'Forum Replies', value: '15' },
                { label: 'Hours Active', value: '48' },
              ].map(s => (
                <div key={s.label} className="text-center bg-white/10 rounded-xl p-3">
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-indigo-200 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
            <Field icon={User} label="Full Name" value={currentUser.name} editKey="name" />
            <Field icon={Mail} label="Email Address" value={currentUser.email} editKey="email" />
            <Field icon={Building} label="Department" value={currentUser.department} editKey="department" />
            <Field icon={Globe} label="Institution" value={currentUser.institution} editKey="institution" />
            <Field icon={MapPin} label="Country" value={currentUser.country} editKey="country" />
            <Field icon={Calendar} label="Timezone" value={currentUser.timezone} editKey="timezone" />
          </div>

          {/* Bio */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Bio</h3>
            <Field icon={User} label="About Me" value={currentUser.bio} editKey="bio" />
          </div>

          {/* My Courses */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">My Courses</h3>
            <div className="space-y-2">
              {myCourses.map(course => (
                <div key={course.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{course.name}</p>
                    <p className="text-xs text-gray-400">{course.enrolledStudents} students</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {course.status}
                  </span>
                </div>
              ))}
              {myCourses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No courses yet</p>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
            <div className="space-y-3">
              {[
                { label: 'Email notifications', desc: 'Receive emails when students submit assignments' },
                { label: 'Forum subscriptions', desc: 'Get notified of new forum posts in my courses' },
                { label: 'Grading reminders', desc: 'Remind me of ungraded submissions after 48 hours' },
                { label: 'AI suggestions', desc: 'Show AI-generated insights and recommendations' },
              ].map(pref => (
                <label key={pref.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pref.label}</p>
                    <p className="text-xs text-gray-400">{pref.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative flex-shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
