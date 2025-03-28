import subprocess

# Open the requirements file and read each line as a package name
with open('requirements.txt') as file:
    packages = file.read().splitlines()

# Uninstall each package individually
for package in packages:
    subprocess.call(['pip', 'uninstall', '-y', package])