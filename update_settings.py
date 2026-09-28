import re

with open('frontend/src/pages/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
state_injection = """  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')"""
content = re.sub(r'  const \[busy, setBusy\] = useState\(false\)\s*const \[message, setMessage\] = useState\(\'\'\)', state_injection, content)

# 2. Add savePassword function
save_fn_injection = """  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) return
    setBusy(true)
    setMessage('')
    try {
      const res = await api<AppSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify({...settings, admin_password: newPassword}),
      })
      setSettings(res)
      setMessage('Admin password updated successfully.')
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function save(e: React.FormEvent) {"""
content = content.replace("  async function save(e: React.FormEvent) {", save_fn_injection)

# 3. Add Change Password button next to title
header_injection = """    <form onSubmit={save} className={cardClass}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">App Settings</h2>
        <button 
          type="button" 
          onClick={() => setShowPasswordModal(true)}
          className="btn-secondary text-sm px-3 py-1.5"
        >
          Change Password
        </button>
      </div>
      {message && <p className="text-green-400">{message}</p>}"""
content = re.sub(r'    <form onSubmit=\{save\} className=\{cardClass\}>\s*<h2 className="text-xl font-bold">App Settings</h2>\s*\{message && <p className="text-green-400">\{message\}</p>\}', header_injection, content)

# 4. Remove the old password field
old_password_field = r'      <div>\s*<label>Admin Password</label>\s*<input required type="password" placeholder="Change admin password" className=\{inputClass\} value=\{settings\.admin_password \|\| \'\'\} onChange=\{e => setSettings\(\{\.\.\.settings, admin_password: e\.target\.value\}\)\} />\s*</div>\n'
content = re.sub(old_password_field, '', content)

# 5. Add the Modal at the bottom
modal_jsx = """    </form>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Change Admin Password</h3>
            <form onSubmit={savePassword}>
              <input 
                type="password" 
                placeholder="New Password" 
                required
                autoFocus
                className="w-full p-3 rounded bg-slate-900 border border-slate-700 mb-6 focus:ring-2 focus:ring-orange-500 outline-none"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={busy || !newPassword}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}"""

content = re.sub(r'    </form>\s*\)\s*\}\s*$', modal_jsx, content)

# Wait, the component returns just <form> ... </form>. Now it returns <form> ... </form> and a modal. So it must be wrapped in fragments: <> ... </>.
content = content.replace("return (\n    <form", "return (\n    <>\n      <form")

with open('frontend/src/pages/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SettingsPage modified successfully")
