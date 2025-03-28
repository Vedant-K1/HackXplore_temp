from server import create_app
from models.student_schema import Module
import os
import csv
app = create_app()

with app.app_context():
    current_dir = os.path.dirname(__file__)
    data_dir = os.path.join(current_dir, 'core','recommendation_data', 'modules.csv')
    print("\n\n================ NEW RECOMMENDATION DATA GENERATED =================\n\n")
    all_modules = Module.query.all()
    with open(data_dir, "w", newline="", encoding="utf-8") as modules_csv:
        module_writer = csv.writer(modules_csv)
        module_writer.writerow(["module_id", "module_name", "topic_id", "level", "summary"])
        for module in all_modules:
            module_writer.writerow([module.module_id, module.module_name, module.topic_id, module.level, module.summary])