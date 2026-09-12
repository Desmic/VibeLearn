"""Package only the allowlisted, credential-free local learning lab."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT=Path(__file__).resolve().parent.parent
FILES=('README.md','contracts.py','worker.py','reference.py','test_worker.py')
def build():
    target=ROOT/'web'/'relay-repair-kit.zip'
    with ZipFile(target,'w',ZIP_DEFLATED) as out:
        for name in FILES:out.write(ROOT/'labs'/'relay-repair'/name,'relay-repair/'+name)
    return target
if __name__=='__main__':print(build())
