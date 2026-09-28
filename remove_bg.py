import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove backgrounds array
content = re.sub(r'const backgrounds = \[.*?\]\s*', '', content, flags=re.DOTALL)

# 2. Remove the background image div from LoginScreen
# We want to remove the specific div with the background image
login_bg_div = r'''<div\s+className="fixed inset-0 z-0 opacity-20"\s+style={{[^}]+}}\s*/>'''
content = re.sub(login_bg_div, '', content, flags=re.DOTALL)

# 3. Remove bgIndex state and useEffect in App component
bg_state_and_effect = r'''const \[bgIndex, setBgIndex\] = useState\(0\)\s*useEffect\(\(\) => \{[^\}]+\}\s*return \(\) => clearInterval\(interval\)\s*\}, \[\]\)\s*'''
content = re.sub(bg_state_and_effect, '', content, flags=re.DOTALL)

# 4. Remove the dark mode background div in App component main section
main_bg_div = r'''\{!isLight && \(\s*<div\s+className="fixed inset-0 z-0 transition-opacity duration-1000"\s+style={{[^}]+}}\s*/>\s*\)\}'''
content = re.sub(main_bg_div, '', content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backgrounds removed successfully")
