#!/bin/bash
# Script to add CRUD buttons to remaining tables

# Add imports and state to OperatorTable
sed -i 's/import { Plus, ArrowUpDown } from/import { Plus, ArrowUpDown, Pencil, Trash2 } from/' src/app/admin/operators/OperatorTable.tsx
sed -i '/import { Dialog/a import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '"'"'@/components/ui/alert-dialog'"'"';' src/app/admin/operators/OperatorTable.tsx
sed -i '/const \[isOpen, setIsOpen\] = useState(false);/a \    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);\n    const [deletingOperator, setDeletingOperator] = useState<Operator | null>(null);' src/app/admin/operators/OperatorTable.tsx

# Add imports and state to VesselTable
sed -i 's/import { Plus, ArrowUpDown } from/import { Plus, ArrowUpDown, Pencil, Trash2 } from/' src/app/admin/vessels/VesselTable.tsx
sed -i '/import { Dialog/a import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '"'"'@/components/ui/alert-dialog'"'"';' src/app/admin/vessels/VesselTable.tsx
sed -i '/const \[isOpen, setIsOpen\] = useState(false);/a \    const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);\n    const [deletingVessel, setDeletingVessel] = useState<Vessel | null>(null);' src/app/admin/vessels/VesselTable.tsx

# Add imports and state to RouteTable  
sed -i 's/import { Plus, ArrowUpDown } from/import { Plus, ArrowUpDown, Pencil, Trash2 } from/' src/app/admin/routes/RouteTable.tsx
sed -i '/import { Dialog/a import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '"'"'@/components/ui/alert-dialog'"'"';' src/app/admin/routes/RouteTable.tsx
sed -i '/const \[isOpen, setIsOpen\] = useState(false);/a \    const [editingRoute, setEditingRoute] = useState<Route | null>(null);\n    const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);' src/app/admin/routes/RouteTable.tsx

echo "CRUD setup complete for all tables"
