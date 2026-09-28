import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add showPassword state
content = content.replace(
    "const [loading, setLoading] = useState(false)",
    "const [loading, setLoading] = useState(false)\n  const [showPassword, setShowPassword] = useState(false)"
)

# Update the password input field
old_input = """<div className="space-y-2">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 text-white p-4 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-slate-500"
              autoFocus
            />
          </div>"""

new_input = """<div className="space-y-2 relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 text-white p-4 pr-12 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-slate-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>"""

content = content.replace(old_input, new_input)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added eye icon successfully")
