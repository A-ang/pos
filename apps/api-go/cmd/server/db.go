package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func openDatabase() (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, nil
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}

func (s *Store) loadFromDatabase() error {
	if s.db == nil {
		return nil
	}

	if err := s.loadUsers(); err != nil {
		return fmt.Errorf("load users: %w", err)
	}
	if err := s.loadPartners(); err != nil {
		return fmt.Errorf("load partners: %w", err)
	}
	if err := s.loadVehicles(); err != nil {
		return fmt.Errorf("load vehicles: %w", err)
	}
	if err := s.loadCustomers(); err != nil {
		return fmt.Errorf("load customers: %w", err)
	}
	if err := s.loadBookings(); err != nil {
		return fmt.Errorf("load bookings: %w", err)
	}
	if err := s.loadTransactions(); err != nil {
		return fmt.Errorf("load transactions: %w", err)
	}
	if err := s.loadMaintenanceLogs(); err != nil {
		return fmt.Errorf("load maintenance logs: %w", err)
	}
	if err := s.loadActivities(); err != nil {
		return fmt.Errorf("load activities: %w", err)
	}
	return nil
}

func (s *Store) loadUsers() error {
	rows, err := s.db.Query(`SELECT id, username, name, password_hash, role, true, created_at FROM users ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []User{}
	maxID := 0
	for rows.Next() {
		var item User
		if err := rows.Scan(&item.ID, &item.Username, &item.Name, &item.Password, &item.Role, &item.Active, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.users = items
	s.nextUserID = maxID + 1
	return rows.Err()
}

func (s *Store) loadPartners() error {
	rows, err := s.db.Query(`SELECT id, name, contact, address, bank_account, notes, active, created_at FROM partners ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Partner{}
	maxID := 0
	for rows.Next() {
		var item Partner
		if err := rows.Scan(&item.ID, &item.Name, &item.Contact, &item.Address, &item.BankAccount, &item.Notes, &item.Active, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.partners = items
	s.nextPartnerID = maxID + 1
	return rows.Err()
}

func (s *Store) loadVehicles() error {
	rows, err := s.db.Query(`SELECT id, name, plate_number, year, color, status, ownership, partner_name, daily_rate, profit_share_percent, notes, created_at FROM vehicles ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Vehicle{}
	maxID := 0
	for rows.Next() {
		var item Vehicle
		if err := rows.Scan(&item.ID, &item.Name, &item.PlateNumber, &item.Year, &item.Color, &item.Status, &item.Ownership, &item.PartnerName, &item.DailyRate, &item.ProfitSharePercent, &item.Notes, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.vehicles = items
	s.nextVehicleID = maxID + 1
	return rows.Err()
}

func (s *Store) loadCustomers() error {
	rows, err := s.db.Query(`SELECT id, name, phone, email, id_number, id_type, address, notes, total_bookings, created_at FROM customers ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Customer{}
	maxID := 0
	for rows.Next() {
		var item Customer
		if err := rows.Scan(&item.ID, &item.Name, &item.Phone, &item.Email, &item.IDNumber, &item.IDType, &item.Address, &item.Notes, &item.TotalBookings, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.customers = items
	s.nextCustomerID = maxID + 1
	return rows.Err()
}

func (s *Store) loadBookings() error {
	rows, err := s.db.Query(`
		SELECT b.id, b.customer_id, b.vehicle_id, c.name, v.name, v.plate_number, b.rental_type, b.status,
		b.start_date, b.end_date, b.start_km, b.start_fuel_bar, b.estimated_km, b.end_km,
		b.base_amount, b.late_fee, b.wash_fee, b.damage_fee, b.other_fee, b.pickup_dropoff_fee,
		b.total_amount, b.notes, b.created_at
		FROM bookings b
		JOIN customers c ON c.id = b.customer_id
		JOIN vehicles v ON v.id = b.vehicle_id
		ORDER BY b.id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Booking{}
	maxID := 0
	for rows.Next() {
		var item Booking
		if err := rows.Scan(
			&item.ID, &item.CustomerID, &item.VehicleID, &item.Customer, &item.Vehicle, &item.Plate,
			&item.RentalType, &item.Status, &item.StartDate, &item.EndDate, &item.StartKM, &item.StartFuelBar,
			&item.EstimatedKM, &item.EndKM, &item.BaseAmount, &item.LateFee, &item.WashFee, &item.DamageFee,
			&item.OtherFee, &item.PickupDropoffFee, &item.TotalAmount, &item.Notes, &item.CreatedAt,
		); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.bookings = items
	s.nextBookingID = maxID + 1
	return rows.Err()
}

func (s *Store) loadTransactions() error {
	rows, err := s.db.Query(`
		SELECT t.id, t.booking_id, t.invoice_number, c.name, v.name, t.amount, t.paid_amount,
		t.status, t.payment_method, t.paid_at, t.notes, t.created_at
		FROM transactions t
		JOIN bookings b ON b.id = t.booking_id
		JOIN customers c ON c.id = b.customer_id
		JOIN vehicles v ON v.id = b.vehicle_id
		ORDER BY t.id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Transaction{}
	maxID := 0
	for rows.Next() {
		var item Transaction
		if err := rows.Scan(&item.ID, &item.BookingID, &item.InvoiceNumber, &item.CustomerName, &item.VehicleName, &item.Amount, &item.PaidAmount, &item.Status, &item.PaymentMethod, &item.PaidAt, &item.Notes, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.transactions = items
	s.nextTxnID = maxID + 1
	return rows.Err()
}

func (s *Store) loadMaintenanceLogs() error {
	rows, err := s.db.Query(`SELECT id, vehicle_id, type, description, cost, due_date, completed_at, created_at FROM maintenance_logs ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []MaintenanceLog{}
	maxID := 0
	for rows.Next() {
		var item MaintenanceLog
		if err := rows.Scan(&item.ID, &item.VehicleID, &item.Type, &item.Description, &item.Cost, &item.DueDate, &item.CompletedAt, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.maintenanceLogs = items
	s.nextLogID = maxID + 1
	return rows.Err()
}

func (s *Store) loadActivities() error {
	rows, err := s.db.Query(`SELECT id, type, description, related_id, created_at FROM activity_logs ORDER BY id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	items := []Activity{}
	maxID := 0
	for rows.Next() {
		var item Activity
		if err := rows.Scan(&item.ID, &item.Type, &item.Description, &item.RelatedID, &item.CreatedAt); err != nil {
			return err
		}
		items = append(items, item)
		if item.ID > maxID {
			maxID = item.ID
		}
	}
	s.activities = items
	s.nextActivityID = maxID + 1
	return rows.Err()
}

func (s *Store) saveUser(user User) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO users (id, username, name, password_hash, role, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,NOW())
	ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username, name=EXCLUDED.name, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, updated_at=NOW()`,
		user.ID, user.Username, user.Name, user.Password, user.Role, user.CreatedAt)
	return err
}

func (s *Store) savePartner(partner Partner) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO partners (id, name, contact, address, bank_account, notes, active, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
	ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, contact=EXCLUDED.contact, address=EXCLUDED.address, bank_account=EXCLUDED.bank_account, notes=EXCLUDED.notes, active=EXCLUDED.active, updated_at=NOW()`,
		partner.ID, partner.Name, partner.Contact, partner.Address, partner.BankAccount, partner.Notes, partner.Active, partner.CreatedAt)
	return err
}

func (s *Store) deletePartner(id int) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`DELETE FROM partners WHERE id = $1`, id)
	return err
}

func (s *Store) saveVehicle(vehicle Vehicle) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO vehicles (id, name, plate_number, year, color, status, ownership, partner_name, daily_rate, profit_share_percent, notes, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
	ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, plate_number=EXCLUDED.plate_number, year=EXCLUDED.year, color=EXCLUDED.color, status=EXCLUDED.status, ownership=EXCLUDED.ownership, partner_name=EXCLUDED.partner_name, daily_rate=EXCLUDED.daily_rate, profit_share_percent=EXCLUDED.profit_share_percent, notes=EXCLUDED.notes, updated_at=NOW()`,
		vehicle.ID, vehicle.Name, vehicle.PlateNumber, vehicle.Year, vehicle.Color, vehicle.Status, vehicle.Ownership, vehicle.PartnerName, vehicle.DailyRate, vehicle.ProfitSharePercent, vehicle.Notes, vehicle.CreatedAt)
	return err
}

func (s *Store) deleteVehicle(id int) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`DELETE FROM vehicles WHERE id = $1`, id)
	return err
}

func (s *Store) saveCustomer(customer Customer) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO customers (id, name, phone, email, id_number, id_type, address, notes, total_bookings, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
	ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, email=EXCLUDED.email, id_number=EXCLUDED.id_number, id_type=EXCLUDED.id_type, address=EXCLUDED.address, notes=EXCLUDED.notes, total_bookings=EXCLUDED.total_bookings, updated_at=NOW()`,
		customer.ID, customer.Name, customer.Phone, customer.Email, customer.IDNumber, customer.IDType, customer.Address, customer.Notes, customer.TotalBookings, customer.CreatedAt)
	return err
}

func (s *Store) saveBooking(booking Booking) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO bookings (id, customer_id, vehicle_id, rental_type, status, start_date, end_date, start_km, start_fuel_bar, estimated_km, end_km, base_amount, late_fee, wash_fee, damage_fee, other_fee, pickup_dropoff_fee, total_amount, notes, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
	ON CONFLICT (id) DO UPDATE SET customer_id=EXCLUDED.customer_id, vehicle_id=EXCLUDED.vehicle_id, rental_type=EXCLUDED.rental_type, status=EXCLUDED.status, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date, start_km=EXCLUDED.start_km, start_fuel_bar=EXCLUDED.start_fuel_bar, estimated_km=EXCLUDED.estimated_km, end_km=EXCLUDED.end_km, base_amount=EXCLUDED.base_amount, late_fee=EXCLUDED.late_fee, wash_fee=EXCLUDED.wash_fee, damage_fee=EXCLUDED.damage_fee, other_fee=EXCLUDED.other_fee, pickup_dropoff_fee=EXCLUDED.pickup_dropoff_fee, total_amount=EXCLUDED.total_amount, notes=EXCLUDED.notes, updated_at=NOW()`,
		booking.ID, booking.CustomerID, booking.VehicleID, booking.RentalType, booking.Status, booking.StartDate, booking.EndDate, booking.StartKM, booking.StartFuelBar, booking.EstimatedKM, booking.EndKM, booking.BaseAmount, booking.LateFee, booking.WashFee, booking.DamageFee, booking.OtherFee, booking.PickupDropoffFee, booking.TotalAmount, booking.Notes, booking.CreatedAt)
	return err
}

func (s *Store) saveTransaction(tx Transaction) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO transactions (id, booking_id, invoice_number, amount, paid_amount, status, payment_method, paid_at, notes, created_at, updated_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
	ON CONFLICT (id) DO UPDATE SET booking_id=EXCLUDED.booking_id, invoice_number=EXCLUDED.invoice_number, amount=EXCLUDED.amount, paid_amount=EXCLUDED.paid_amount, status=EXCLUDED.status, payment_method=EXCLUDED.payment_method, paid_at=EXCLUDED.paid_at, notes=EXCLUDED.notes, updated_at=NOW()`,
		tx.ID, tx.BookingID, tx.InvoiceNumber, tx.Amount, tx.PaidAmount, tx.Status, tx.PaymentMethod, tx.PaidAt, tx.Notes, tx.CreatedAt)
	return err
}

func (s *Store) saveMaintenanceLog(logItem MaintenanceLog) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO maintenance_logs (id, vehicle_id, type, description, cost, due_date, completed_at, created_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	ON CONFLICT (id) DO UPDATE SET vehicle_id=EXCLUDED.vehicle_id, type=EXCLUDED.type, description=EXCLUDED.description, cost=EXCLUDED.cost, due_date=EXCLUDED.due_date, completed_at=EXCLUDED.completed_at`,
		logItem.ID, logItem.VehicleID, logItem.Type, logItem.Description, logItem.Cost, logItem.DueDate, logItem.CompletedAt, logItem.CreatedAt)
	return err
}

func (s *Store) saveActivity(activity Activity) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`INSERT INTO activity_logs (id, type, description, related_id, created_at)
	VALUES ($1,$2,$3,$4,$5)
	ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type, description=EXCLUDED.description, related_id=EXCLUDED.related_id`,
		activity.ID, activity.Type, activity.Description, activity.RelatedID, activity.CreatedAt)
	return err
}
