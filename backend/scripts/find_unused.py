import ast
import os
import sys

class ImportVisitor(ast.NodeVisitor):
    def __init__(self):
        self.imports = [] # list of (name, lineno, is_type_checking)
        self.used_names = set()
        self.in_type_checking = False

    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name.split('.')[0]
            self.imports.append((name, node.lineno, self.in_type_checking))
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module == '__future__': return
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            if name == '*': continue
            self.imports.append((name, node.lineno, self.in_type_checking))
        self.generic_visit(node)

    def visit_If(self, node):
        # Check if this is "if TYPE_CHECKING:"
        is_type_checking_block = False
        if isinstance(node.test, ast.Name) and node.test.id == 'TYPE_CHECKING':
            is_type_checking_block = True
        # Also check "if typing.TYPE_CHECKING:"
        elif isinstance(node.test, ast.Attribute) and node.test.attr == 'TYPE_CHECKING':
            is_type_checking_block = True
            
        # Visit test
        self.visit(node.test)
        
        # Visit body
        prev_state = self.in_type_checking
        if is_type_checking_block:
            self.in_type_checking = True
            
        for stmt in node.body:
            self.visit(stmt)
            
        self.in_type_checking = prev_state
        
        # Visit orelse
        for stmt in node.orelse:
            self.visit(stmt)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used_names.add(node.id)
        self.generic_visit(node)
        
    def visit_Assign(self, node):
        # Handle __all__
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == '__all__':
                if isinstance(node.value, ast.List):
                    for elt in node.value.elts:
                        if isinstance(elt, ast.Constant): # python 3.8+
                            self.used_names.add(elt.value)
                        elif isinstance(elt, ast.Str): # python < 3.8
                            self.used_names.add(elt.s)
        self.generic_visit(node)

def get_unused_imports(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
        
        tree = ast.parse(code)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return []

    visitor = ImportVisitor()
    visitor.visit(tree)
    
    lines = code.splitlines()
    unused = []
    
    for name, lineno, is_tc in visitor.imports:
        # Skip if inside TYPE_CHECKING block
        if is_tc:
            continue
            
        # Skip if line has # noqa
        # lineno is 1-based
        if lineno <= len(lines):
            line_content = lines[lineno-1]
            if '# noqa' in line_content:
                continue
                
        if name not in visitor.used_names:
            # Ignore __init__.py files
            if os.path.basename(filepath) == '__init__.py':
                continue
            unused.append((name, lineno))
            
    return unused

def main():
    root_dir = os.getcwd()
    found_unused = False
    for root, dirs, files in os.walk(root_dir):
        # Skip venv or other common ignore dirs
        if 'venv' in root or '__pycache__' in root:
            continue
            
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                unused = get_unused_imports(filepath)
                if unused:
                    found_unused = True
                    print(f"File: {filepath}")
                    for name, line in unused:
                        print(f"  Line {line}: {name}")
    
    if not found_unused:
        print("No unused imports found.")
        sys.exit(0)
    else:
        print("\nUnused imports found. Please remove them or add '# noqa' to ignore.")
        sys.exit(1)

if __name__ == '__main__':
    main()
