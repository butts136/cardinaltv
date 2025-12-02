#!/usr/bin/env python
"""
Script de vérification des fonctionnalités Cardinal TV.
Usage: python scripts/verify.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_imports():
    """Vérifie que toutes les dépendances sont importables."""
    print("Vérification des dépendances...")
    deps = ["flask", "waitress"]
    optional_deps = ["fitz", "PIL", "docx", "PyPDF2"]
    
    for dep in deps:
        try:
            __import__(dep)
            print(f"  ✓ {dep}")
        except ImportError as e:
            print(f"  ✗ {dep} - Import error: {e}")
            return False
    
    for dep in optional_deps:
        try:
            __import__(dep)
            print(f"  ✓ {dep} (optionnel)")
        except ImportError:
            print(f"  ○ {dep} (optionnel, non installé)")
    
    return True

def check_app_import():
    """Vérifie que app.py est importable."""
    print("\nVérification de app.py...")
    try:
        import app
        print("  ✓ app.py importable")
        return True
    except Exception as e:
        print(f"  ✗ Erreur d'import: {e}")
        return False

def check_api_endpoints():
    """Vérifie que les endpoints API sont définis."""
    print("\nVérification des endpoints API...")
    try:
        import app
        
        endpoints_to_check = [
            "/api/settings",
            "/api/media",
            "/api/employees",
            "/api/time-change-slide/next",
            "/api/christmas-slide/next",
            "/api/birthday-slide/config",
        ]
        
        # Get all registered routes
        rules = {rule.rule for rule in app.app.url_map.iter_rules()}
        
        for endpoint in endpoints_to_check:
            found = any(endpoint == rule or endpoint in rule for rule in rules)
            if found:
                print(f"  ✓ {endpoint}")
            else:
                print(f"  ✗ {endpoint} - non trouvé")
        
        return True
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
        return False

def check_christmas_function():
    """Vérifie la fonction _next_christmas_info."""
    print("\nVérification de la fonction Noël...")
    try:
        import app
        info = app._next_christmas_info()
        if info:
            print(f"  ✓ _next_christmas_info() retourne: jours={info.get('days_until')}, date={info.get('date_label')}")
            return True
        else:
            print("  ○ _next_christmas_info() retourne None (normal après Noël)")
            return True
    except Exception as e:
        print(f"  ✗ Erreur: {e}")
        return False

def check_frontend_files():
    """Vérifie que les fichiers frontend existent."""
    print("\nVérification des fichiers frontend...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    files_to_check = [
        "frontend/static/js/app.js",
        "frontend/static/js/slideshow.js",
        "frontend/static/css/styles.css",
        "frontend/templates/base.html",
        "frontend/templates/christmas.html",
        "frontend/templates/birthday.html",
        "frontend/templates/time_change.html",
    ]
    
    all_found = True
    for filepath in files_to_check:
        full_path = os.path.join(base_dir, filepath)
        if os.path.exists(full_path):
            print(f"  ✓ {filepath}")
        else:
            print(f"  ✗ {filepath} - non trouvé")
            all_found = False
    
    return all_found

def check_christmas_in_slideshow():
    """Vérifie que le Christmas slide est implémenté dans slideshow.js."""
    print("\nVérification de l'implémentation Christmas dans slideshow.js...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    slideshow_path = os.path.join(base_dir, "frontend/static/js/slideshow.js")
    
    with open(slideshow_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    checks = [
        ("CHRISTMAS_SLIDE_ID", 'const CHRISTMAS_SLIDE_ID' in content or 'CHRISTMAS_SLIDE_ID' in content),
        ("DEFAULT_CHRISTMAS_SLIDE", "DEFAULT_CHRISTMAS_SLIDE" in content),
        ("christmasSlideSettings", "christmasSlideSettings" in content),
        ("renderChristmasSlide", "renderChristmasSlide" in content),
        ("christmas detection", '"christmas"' in content or "'christmas'" in content),
        ("buildChristmasSlideItem", "buildChristmasSlideItem" in content),
    ]
    
    all_passed = True
    for name, found in checks:
        if found:
            print(f"  ✓ {name}")
        else:
            print(f"  ✗ {name} - manquant")
            all_passed = False
    
    return all_passed

def check_navigation_submenu():
    """Vérifie que le sous-menu Diapo auto-généré est présent dans la navigation."""
    print("\nVérification du sous-menu Diapo auto-généré...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    base_html_path = os.path.join(base_dir, "frontend/templates/base.html")
    
    with open(base_html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    checks = [
        ("nav-submenu class", "nav-submenu" in content),
        ("Diapo auto-généré label", "Diapo auto-généré" in content),
        ("fetes_endpoints", "fetes_endpoints" in content),
        ("nav-submenu-toggle", "nav-submenu-toggle" in content),
    ]
    
    all_passed = True
    for name, found in checks:
        if found:
            print(f"  ✓ {name}")
        else:
            print(f"  ✗ {name} - manquant")
            all_passed = False
    
    return all_passed

def main():
    """Point d'entrée principal."""
    print("=" * 50)
    print("Vérification Cardinal TV")
    print("=" * 50)
    
    results = []
    results.append(("Dépendances", check_imports()))
    results.append(("Import app.py", check_app_import()))
    results.append(("Endpoints API", check_api_endpoints()))
    results.append(("Fonction Noël", check_christmas_function()))
    results.append(("Fichiers frontend", check_frontend_files()))
    results.append(("Christmas slideshow", check_christmas_in_slideshow()))
    results.append(("Sous-menu Diapo auto-généré", check_navigation_submenu()))
    
    print("\n" + "=" * 50)
    print("Résumé")
    print("=" * 50)
    
    all_passed = True
    for name, passed in results:
        status = "✓" if passed else "✗"
        print(f"  {status} {name}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("Toutes les vérifications ont réussi.")
        return 0
    else:
        print("Certaines vérifications ont échoué.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
