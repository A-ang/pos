package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Password  string    `json:"-"`
	Role      string    `json:"role"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
}

type Partner struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Contact     string    `json:"contact"`
	Address     string    `json:"address"`
	BankAccount string    `json:"bankAccount"`
	Notes       *string   `json:"notes"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Vehicle struct {
	ID                 int       `json:"id"`
	Name               string    `json:"name"`
	PlateNumber        string    `json:"plateNumber"`
	Year               int       `json:"year"`
	Color              string    `json:"color"`
	Status             string    `json:"status"`
	Ownership          string    `json:"ownership"`
	PartnerName        *string   `json:"partnerName"`
	DailyRate          float64   `json:"dailyRate"`
	ProfitSharePercent *float64  `json:"profitSharePercent"`
	Notes              *string   `json:"notes"`
	CreatedAt          time.Time `json:"createdAt"`
}

type Customer struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Phone         string    `json:"phone"`
	Email         *string   `json:"email"`
	IDNumber      string    `json:"idNumber"`
	IDType        string    `json:"idType"`
	Address       *string   `json:"address"`
	Notes         *string   `json:"notes"`
	TotalBookings int       `json:"totalBookings"`
	CreatedAt     time.Time `json:"createdAt"`
}

type Booking struct {
	ID               int       `json:"id"`
	CustomerID       int       `json:"customerId"`
	VehicleID        int       `json:"vehicleId"`
	Customer         string    `json:"customerName"`
	Vehicle          string    `json:"vehicleName"`
	Plate            string    `json:"vehiclePlate"`
	RentalType       string    `json:"rentalType"`
	Status           string    `json:"status"`
	StartDate        time.Time `json:"startDate"`
	EndDate          time.Time `json:"endDate"`
	StartKM          *int      `json:"startKm"`
	EndKM            *int      `json:"endKm"`
	BaseAmount       float64   `json:"baseAmount"`
	LateFee          float64   `json:"lateFee"`
	WashFee          float64   `json:"washFee"`
	DamageFee        float64   `json:"damageFee"`
	OtherFee         float64   `json:"otherFee"`
	PickupDropoffFee float64   `json:"pickupDropoffFee"`
	TotalAmount      float64   `json:"totalAmount"`
	Notes            *string   `json:"notes"`
	CreatedAt        time.Time `json:"createdAt"`
}

type Transaction struct {
	ID            int        `json:"id"`
	BookingID     int        `json:"bookingId"`
	InvoiceNumber string     `json:"invoiceNumber"`
	CustomerName  string     `json:"customerName"`
	VehicleName   string     `json:"vehicleName"`
	Amount        float64    `json:"amount"`
	PaidAmount    float64    `json:"paidAmount"`
	Status        string     `json:"status"`
	PaymentMethod *string    `json:"paymentMethod"`
	PaidAt        *time.Time `json:"paidAt"`
	Notes         *string    `json:"notes"`
	CreatedAt     time.Time  `json:"createdAt"`
}

type MaintenanceLog struct {
	ID          int        `json:"id"`
	VehicleID   int        `json:"vehicleId"`
	Type        string     `json:"type"`
	Description string     `json:"description"`
	Cost        *float64   `json:"cost"`
	DueDate     *time.Time `json:"dueDate"`
	CompletedAt *time.Time `json:"completedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
}

type Activity struct {
	ID          int       `json:"id"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	RelatedID   *int      `json:"relatedId"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Store struct {
	mu              sync.Mutex
	users           []User
	partners        []Partner
	vehicles        []Vehicle
	customers       []Customer
	bookings        []Booking
	transactions    []Transaction
	maintenanceLogs []MaintenanceLog
	activities      []Activity
	sessions        map[string]int
	nextUserID      int
	nextVehicleID   int
	nextPartnerID   int
	nextCustomerID  int
	nextBookingID   int
	nextTxnID       int
	nextLogID       int
	nextActivityID  int
}

func newStore() *Store {
	now := time.Now()
	partner := "PT Mitra Armada Nusantara"
	share := 70.0
	note := "Unit titipan prioritas partner"
	partnerNotes := "Pembagian hasil dibayarkan setiap akhir bulan"
	email1 := "andi@example.com"
	email2 := "sinta@example.com"
	addr1 := "Jl. Melati No. 12, Jakarta"
	addr2 := "Jl. Mawar No. 5, Bandung"
	payMethod := "transfer"
	startKM := 45210
	endKM := 45555
	relatedBooking := 1
	relatedTxn := 1

	partners := []Partner{
		{ID: 1, Name: partner, Contact: "081212345678", Address: "Jl. Kemang Raya No. 8, Jakarta", BankAccount: "BCA 1234567890 a/n PT Mitra Armada Nusantara", Notes: &partnerNotes, Active: true, CreatedAt: now.AddDate(0, -4, 0)},
	}

	vehicles := []Vehicle{
		{ID: 1, Name: "Toyota Avanza 1.5 G", PlateNumber: "B 1234 CD", Year: 2023, Color: "Hitam", Status: "available", Ownership: "internal", DailyRate: 350000, CreatedAt: now.AddDate(0, -2, 0)},
		{ID: 2, Name: "Honda Brio RS", PlateNumber: "D 9876 EF", Year: 2022, Color: "Merah", Status: "maintenance", Ownership: "external", PartnerName: &partner, ProfitSharePercent: &share, Notes: &note, DailyRate: 300000, CreatedAt: now.AddDate(0, -3, 0)},
	}
	customers := []Customer{
		{ID: 1, Name: "Andi Saputra", Phone: "081234567890", Email: &email1, IDNumber: "3174010101010001", IDType: "ktp", Address: &addr1, TotalBookings: 2, CreatedAt: now.AddDate(0, -1, -10)},
		{ID: 2, Name: "Sinta Lestari", Phone: "082233445566", Email: &email2, IDNumber: "3273010101010002", IDType: "sim", Address: &addr2, TotalBookings: 1, CreatedAt: now.AddDate(0, -1, -2)},
	}
	bookings := []Booking{
		{ID: 1, CustomerID: 1, VehicleID: 1, Customer: customers[0].Name, Vehicle: vehicles[0].Name, Plate: vehicles[0].PlateNumber, RentalType: "self_drive", Status: "completed", StartDate: now.AddDate(0, 0, -7), EndDate: now.AddDate(0, 0, -5), StartKM: &startKM, EndKM: &endKM, BaseAmount: 700000, WashFee: 50000, PickupDropoffFee: 50000, TotalAmount: 800000, CreatedAt: now.AddDate(0, 0, -7)},
		{ID: 2, CustomerID: 2, VehicleID: 2, Customer: customers[1].Name, Vehicle: vehicles[1].Name, Plate: vehicles[1].PlateNumber, RentalType: "with_driver", Status: "pending", StartDate: now.AddDate(0, 0, 1), EndDate: now.AddDate(0, 0, 3), BaseAmount: 600000, PickupDropoffFee: 0, TotalAmount: 600000, CreatedAt: now.AddDate(0, 0, -1)},
	}
	transactions := []Transaction{{ID: 1, BookingID: 1, InvoiceNumber: "INV-202604001", CustomerName: customers[0].Name, VehicleName: vehicles[0].Name, Amount: 800000, PaidAmount: 800000, Status: "paid", PaymentMethod: &payMethod, PaidAt: &now, CreatedAt: now.AddDate(0, 0, -5)}}
	logs := []MaintenanceLog{{ID: 1, VehicleID: 2, Type: "periodic_service", Description: "Servis berkala 10.000 KM", Cost: floatPtr(450000), DueDate: timePtr(now.AddDate(0, 0, 2)), CreatedAt: now.AddDate(0, 0, -2)}}
	activities := []Activity{{ID: 1, Type: "booking_created", Description: "Reservasi baru dibuat untuk Andi Saputra", RelatedID: &relatedBooking, CreatedAt: now.Add(-48 * time.Hour)}, {ID: 2, Type: "payment", Description: "Pembayaran invoice INV-202604001 diterima", RelatedID: &relatedTxn, CreatedAt: now.Add(-24 * time.Hour)}}
	users := []User{{ID: 1, Username: "admin", Name: "Administrator", Password: "admin123", Role: "admin", Active: true, CreatedAt: now.AddDate(0, -3, 0)}, {ID: 2, Username: "budi", Name: "Budi Operasional", Password: "admin123", Role: "staff", Active: true, CreatedAt: now.AddDate(0, -2, 0)}, {ID: 3, Username: "mitra1", Name: "Pemilik Mitra", Password: "admin123", Role: "owner", Active: true, CreatedAt: now.AddDate(0, -1, 0)}}
	return &Store{users: users, partners: partners, vehicles: vehicles, customers: customers, bookings: bookings, transactions: transactions, maintenanceLogs: logs, activities: activities, sessions: map[string]int{}, nextUserID: 4, nextPartnerID: 2, nextVehicleID: 3, nextCustomerID: 3, nextBookingID: 3, nextTxnID: 2, nextLogID: 2, nextActivityID: 3}
}

func main() {
	store := newStore()
	port := getenv("PORT", "8080")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "api-backend-golang"})
	})
	mux.HandleFunc("/api/users/login", store.handleLogin)
	mux.HandleFunc("/api/users/logout", store.handleLogout)
	mux.HandleFunc("/api/users/me", store.handleCurrentUser)
	mux.HandleFunc("/api/users", store.handleUsers)
	mux.HandleFunc("/api/users/", store.handleUserRoutes)
	mux.HandleFunc("/api/partners", store.handlePartners)
	mux.HandleFunc("/api/partners/", store.handlePartnerRoutes)
	mux.HandleFunc("/api/vehicles", store.handleVehicles)
	mux.HandleFunc("/api/vehicles/", store.handleVehicleRoutes)
	mux.HandleFunc("/api/customers", store.handleCustomers)
	mux.HandleFunc("/api/customers/", store.handleCustomerRoutes)
	mux.HandleFunc("/api/bookings", store.handleBookings)
	mux.HandleFunc("/api/bookings/", store.handleBookingRoutes)
	mux.HandleFunc("/api/transactions", store.handleTransactions)
	mux.HandleFunc("/api/transactions/", store.handleTransactionRoutes)
	mux.HandleFunc("/api/reports/dashboard", store.handleDashboard)
	mux.HandleFunc("/api/reports/revenue", store.handleRevenue)
	mux.HandleFunc("/api/reports/vehicles", store.handleVehicleReport)
	mux.HandleFunc("/api/reports/partners", store.handlePartnerReport)
	mux.HandleFunc("/api/reports/recent-activity", store.handleRecentActivity)
	log.Printf("api-backend-golang listening on :%s", port)
	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Store) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var body struct{ Username, Password string }
	if !decodeJSON(w, r, &body) {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, user := range s.users {
		if user.Username == body.Username && user.Password == body.Password && user.Active {
			token := randomToken()
			s.sessions[token] = user.ID
			http.SetCookie(w, &http.Cookie{Name: "session_id", Value: token, Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode})
			writeJSON(w, http.StatusOK, map[string]any{"user": sanitizeUser(user)})
			return
		}
	}
	writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Invalid credentials"})
}

func (s *Store) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	if cookie, err := r.Cookie("session_id"); err == nil {
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
	}
	http.SetCookie(w, &http.Cookie{Name: "session_id", Value: "", Path: "/", MaxAge: -1, HttpOnly: true})
	w.WriteHeader(http.StatusNoContent)
}

func (s *Store) handleCurrentUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	user, ok := s.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Unauthenticated"})
		return
	}
	writeJSON(w, http.StatusOK, sanitizeUser(user))
}

func (s *Store) handleUsers(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		items := make([]any, 0, len(s.users))
		for _, user := range s.users {
			items = append(items, sanitizeUser(user))
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body struct{ Username, Name, Password, Role string }
		if !decodeJSON(w, r, &body) {
			return
		}
		user := User{ID: s.nextUserID, Username: body.Username, Name: body.Name, Password: body.Password, Role: body.Role, Active: true, CreatedAt: time.Now()}
		s.nextUserID++
		s.users = append(s.users, user)
		writeJSON(w, http.StatusCreated, sanitizeUser(user))
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleUserRoutes(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/users/"), "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findUserIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "User not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, sanitizeUser(s.users[idx]))
	case http.MethodPatch:
		var body struct {
			Name     *string `json:"name"`
			Role     *string `json:"role"`
			Password *string `json:"password"`
			Active   *bool   `json:"active"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		if body.Name != nil {
			s.users[idx].Name = *body.Name
		}
		if body.Role != nil {
			s.users[idx].Role = *body.Role
		}
		if body.Password != nil && strings.TrimSpace(*body.Password) != "" {
			s.users[idx].Password = *body.Password
		}
		if body.Active != nil {
			s.users[idx].Active = *body.Active
		}
		writeJSON(w, http.StatusOK, sanitizeUser(s.users[idx]))
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handlePartners(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.partners)
	case http.MethodPost:
		var body struct {
			Name        string  `json:"name"`
			Contact     string  `json:"contact"`
			Address     string  `json:"address"`
			BankAccount string  `json:"bankAccount"`
			Notes       *string `json:"notes"`
			Active      *bool   `json:"active"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		active := true
		if body.Active != nil {
			active = *body.Active
		}
		partner := Partner{ID: s.nextPartnerID, Name: body.Name, Contact: body.Contact, Address: body.Address, BankAccount: body.BankAccount, Notes: body.Notes, Active: active, CreatedAt: time.Now()}
		s.nextPartnerID++
		s.partners = append(s.partners, partner)
		writeJSON(w, http.StatusCreated, partner)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handlePartnerRoutes(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/partners/"), "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findPartnerIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Partner not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.partners[idx])
	case http.MethodPatch:
		var body struct {
			Name        *string `json:"name"`
			Contact     *string `json:"contact"`
			Address     *string `json:"address"`
			BankAccount *string `json:"bankAccount"`
			Notes       *string `json:"notes"`
			Active      *bool   `json:"active"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		if body.Name != nil {
			s.partners[idx].Name = *body.Name
		}
		if body.Contact != nil {
			s.partners[idx].Contact = *body.Contact
		}
		if body.Address != nil {
			s.partners[idx].Address = *body.Address
		}
		if body.BankAccount != nil {
			s.partners[idx].BankAccount = *body.BankAccount
		}
		if body.Notes != nil {
			s.partners[idx].Notes = body.Notes
		}
		if body.Active != nil {
			s.partners[idx].Active = *body.Active
		}
		writeJSON(w, http.StatusOK, s.partners[idx])
	case http.MethodDelete:
		s.partners = append(s.partners[:idx], s.partners[idx+1:]...)
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleVehicles(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		status := r.URL.Query().Get("status")
		ownership := r.URL.Query().Get("ownership")
		items := []Vehicle{}
		for _, v := range s.vehicles {
			if (status == "" || v.Status == status) && (ownership == "" || v.Ownership == ownership) {
				items = append(items, v)
			}
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body Vehicle
		if !decodeJSON(w, r, &body) {
			return
		}
		body.ID = s.nextVehicleID
		body.CreatedAt = time.Now()
		if body.Status == "" {
			body.Status = "available"
		}
		s.nextVehicleID++
		s.vehicles = append(s.vehicles, body)
		writeJSON(w, http.StatusCreated, body)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleVehicleRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/vehicles/")
	if strings.HasSuffix(path, "/maintenance") {
		id, err := strconv.Atoi(strings.Trim(strings.TrimSuffix(path, "/maintenance"), "/"))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
			return
		}
		s.handleMaintenanceLogs(w, r, id)
		return
	}
	id, err := strconv.Atoi(strings.Trim(path, "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findVehicleIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Vehicle not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.vehicles[idx])
	case http.MethodPatch:
		var body map[string]any
		if !decodeJSON(w, r, &body) {
			return
		}
		applyVehiclePatch(&s.vehicles[idx], body)
		writeJSON(w, http.StatusOK, s.vehicles[idx])
	case http.MethodDelete:
		s.vehicles = append(s.vehicles[:idx], s.vehicles[idx+1:]...)
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleMaintenanceLogs(w http.ResponseWriter, r *http.Request, vehicleID int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		items := []MaintenanceLog{}
		for _, item := range s.maintenanceLogs {
			if item.VehicleID == vehicleID {
				items = append(items, item)
			}
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body MaintenanceLog
		if !decodeJSON(w, r, &body) {
			return
		}
		body.ID = s.nextLogID
		body.VehicleID = vehicleID
		body.CreatedAt = time.Now()
		s.nextLogID++
		s.maintenanceLogs = append(s.maintenanceLogs, body)
		writeJSON(w, http.StatusCreated, body)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleCustomers(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		search := strings.ToLower(r.URL.Query().Get("search"))
		items := []Customer{}
		for _, c := range s.customers {
			if search == "" || strings.Contains(strings.ToLower(c.Name), search) {
				items = append(items, c)
			}
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body Customer
		if !decodeJSON(w, r, &body) {
			return
		}
		body.ID = s.nextCustomerID
		body.CreatedAt = time.Now()
		s.nextCustomerID++
		s.customers = append(s.customers, body)
		writeJSON(w, http.StatusCreated, body)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleCustomerRoutes(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/customers/"), "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findCustomerIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Customer not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.customers[idx])
	case http.MethodPatch:
		var body map[string]any
		if !decodeJSON(w, r, &body) {
			return
		}
		applyCustomerPatch(&s.customers[idx], body)
		writeJSON(w, http.StatusOK, s.customers[idx])
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleBookings(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		status := r.URL.Query().Get("status")
		vehicleID, _ := strconv.Atoi(r.URL.Query().Get("vehicleId"))
		items := []Booking{}
		for _, b := range s.bookings {
			if (status == "" || b.Status == status) && (vehicleID == 0 || b.VehicleID == vehicleID) {
				items = append(items, b)
			}
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body struct {
			CustomerID       int      `json:"customerId"`
			VehicleID        int      `json:"vehicleId"`
			RentalType       string   `json:"rentalType"`
			StartDate        string   `json:"startDate"`
			EndDate          string   `json:"endDate"`
			Notes            *string  `json:"notes"`
			PickupDropoffFee *float64 `json:"pickupDropoffFee"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		customer := s.findCustomer(body.CustomerID)
		vehicle := s.findVehicle(body.VehicleID)
		if customer == nil || vehicle == nil {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "Customer or vehicle not found"})
			return
		}
		start, _ := time.Parse(time.RFC3339, body.StartDate)
		end, _ := time.Parse(time.RFC3339, body.EndDate)
		days := math.Max(1, math.Ceil(end.Sub(start).Hours()/24))
		base := vehicle.DailyRate * days
		pickupDropoffFee := 0.0
		if body.PickupDropoffFee != nil {
			pickupDropoffFee = *body.PickupDropoffFee
		}
		booking := Booking{ID: s.nextBookingID, CustomerID: body.CustomerID, VehicleID: body.VehicleID, Customer: customer.Name, Vehicle: vehicle.Name, Plate: vehicle.PlateNumber, RentalType: body.RentalType, Status: "pending", StartDate: start, EndDate: end, BaseAmount: base, PickupDropoffFee: pickupDropoffFee, TotalAmount: base + pickupDropoffFee, Notes: body.Notes, CreatedAt: time.Now()}
		s.nextBookingID++
		s.bookings = append(s.bookings, booking)
		customer.TotalBookings++
		s.addActivity("booking_created", "Reservasi baru: "+customer.Name+" - "+vehicle.Name, booking.ID)
		writeJSON(w, http.StatusCreated, booking)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleBookingRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/bookings/")
	if strings.HasSuffix(path, "/checkin") {
		id, _ := strconv.Atoi(strings.Trim(strings.TrimSuffix(path, "/checkin"), "/"))
		s.handleCheckin(w, r, id)
		return
	}
	if strings.HasSuffix(path, "/checkout") {
		id, _ := strconv.Atoi(strings.Trim(strings.TrimSuffix(path, "/checkout"), "/"))
		s.handleCheckout(w, r, id)
		return
	}
	id, err := strconv.Atoi(strings.Trim(path, "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findBookingIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Booking not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.bookings[idx])
	case http.MethodPatch:
		var body map[string]any
		if !decodeJSON(w, r, &body) {
			return
		}
		applyBookingPatch(&s.bookings[idx], body)
		writeJSON(w, http.StatusOK, s.bookings[idx])
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleCheckin(w http.ResponseWriter, r *http.Request, id int) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var body struct {
		StartKM int `json:"startKm"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findBookingIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Booking not found"})
		return
	}
	booking := &s.bookings[idx]
	booking.Status = "active"
	booking.StartKM = &body.StartKM
	if v := s.findVehicle(booking.VehicleID); v != nil {
		v.Status = "rented"
	}
	s.addActivity("checkin", "Check-in: "+booking.Customer+" - "+booking.Vehicle, booking.ID)
	writeJSON(w, http.StatusOK, booking)
}

func (s *Store) handleCheckout(w http.ResponseWriter, r *http.Request, id int) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var body struct {
		EndKM     int     `json:"endKm"`
		LateFee   float64 `json:"lateFee"`
		WashFee   float64 `json:"washFee"`
		DamageFee float64 `json:"damageFee"`
		OtherFee  float64 `json:"otherFee"`
		Notes     *string `json:"notes"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findBookingIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Booking not found"})
		return
	}
	booking := &s.bookings[idx]
	booking.Status = "completed"
	booking.EndKM = &body.EndKM
	booking.LateFee = body.LateFee
	booking.WashFee = body.WashFee
	booking.DamageFee = body.DamageFee
	booking.OtherFee = body.OtherFee
	booking.TotalAmount = booking.BaseAmount + booking.PickupDropoffFee + body.LateFee + body.WashFee + body.DamageFee + body.OtherFee
	booking.Notes = body.Notes
	if v := s.findVehicle(booking.VehicleID); v != nil {
		v.Status = "available"
	}
	tx := Transaction{ID: s.nextTxnID, BookingID: booking.ID, InvoiceNumber: "INV-" + strconv.FormatInt(time.Now().Unix(), 10), CustomerName: booking.Customer, VehicleName: booking.Vehicle, Amount: booking.TotalAmount, PaidAmount: 0, Status: "unpaid", CreatedAt: time.Now()}
	s.nextTxnID++
	s.transactions = append(s.transactions, tx)
	s.addActivity("checkout", "Check-out: "+booking.Customer+" - "+booking.Vehicle, booking.ID)
	writeJSON(w, http.StatusOK, booking)
}

func (s *Store) handleTransactions(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch r.Method {
	case http.MethodGet:
		status := r.URL.Query().Get("status")
		items := []Transaction{}
		for _, tx := range s.transactions {
			if status == "" || tx.Status == status {
				items = append(items, tx)
			}
		}
		writeJSON(w, http.StatusOK, items)
	case http.MethodPost:
		var body struct {
			BookingID int     `json:"bookingId"`
			Amount    float64 `json:"amount"`
			Notes     *string `json:"notes"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		booking := s.findBooking(body.BookingID)
		if booking == nil {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "Booking not found"})
			return
		}
		tx := Transaction{ID: s.nextTxnID, BookingID: body.BookingID, InvoiceNumber: "INV-" + strconv.FormatInt(time.Now().Unix(), 10), CustomerName: booking.Customer, VehicleName: booking.Vehicle, Amount: body.Amount, PaidAmount: 0, Status: "unpaid", Notes: body.Notes, CreatedAt: time.Now()}
		s.nextTxnID++
		s.transactions = append(s.transactions, tx)
		writeJSON(w, http.StatusCreated, tx)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleTransactionRoutes(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/transactions/"), "/"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid id"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := s.findTransactionIndex(id)
	if idx == -1 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Transaction not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, s.transactions[idx])
	case http.MethodPatch:
		var body struct {
			PaidAmount    *float64 `json:"paidAmount"`
			Status        *string  `json:"status"`
			PaymentMethod *string  `json:"paymentMethod"`
			Notes         *string  `json:"notes"`
		}
		if !decodeJSON(w, r, &body) {
			return
		}
		tx := &s.transactions[idx]
		if body.PaidAmount != nil {
			tx.PaidAmount = *body.PaidAmount
		}
		if body.Status != nil {
			tx.Status = *body.Status
		}
		if body.PaymentMethod != nil {
			tx.PaymentMethod = body.PaymentMethod
		}
		if body.Notes != nil {
			tx.Notes = body.Notes
		}
		if tx.Status == "paid" {
			now := time.Now()
			tx.PaidAt = &now
		}
		s.addActivity("payment", "Pembayaran diterima: "+tx.InvoiceNumber, tx.ID)
		writeJSON(w, http.StatusOK, tx)
	default:
		methodNotAllowed(w)
	}
}

func (s *Store) handleDashboard(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var available, rented, maintenance, active, pending, unpaid int
	var monthRevenue, todayRevenue, internalMonthRevenue, partnerCompanyMonthRevenue, partnerOwnerMonthRevenue float64
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	for _, v := range s.vehicles {
		switch v.Status {
		case "available":
			available++
		case "rented":
			rented++
		case "maintenance":
			maintenance++
		}
	}
	for _, b := range s.bookings {
		switch b.Status {
		case "active":
			active++
		case "pending":
			pending++
		}
	}
	for _, tx := range s.transactions {
		if tx.Status == "unpaid" || tx.Status == "partial" {
			unpaid++
		}
		if tx.CreatedAt.After(monthStart) {
			monthRevenue += tx.PaidAmount
			booking := s.findBooking(tx.BookingID)
			if booking != nil {
				vehicle := s.findVehicle(booking.VehicleID)
				if vehicle != nil {
					if vehicle.Ownership == "internal" {
						internalMonthRevenue += tx.PaidAmount
					} else {
						share := 70.0
						if vehicle.ProfitSharePercent != nil {
							share = *vehicle.ProfitSharePercent
						}
						partnerOwnerMonthRevenue += tx.PaidAmount * share / 100
						partnerCompanyMonthRevenue += tx.PaidAmount * (100 - share) / 100
					}
				}
			}
		}
		if tx.CreatedAt.After(todayStart) {
			todayRevenue += tx.PaidAmount
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"totalVehicles": len(s.vehicles), "availableVehicles": available, "rentedVehicles": rented, "maintenanceVehicles": maintenance, "activeBookings": active, "pendingBookings": pending, "totalRevenueThisMonth": monthRevenue, "totalRevenueToday": todayRevenue, "internalRevenueThisMonth": internalMonthRevenue, "partnerCompanyRevenueThisMonth": partnerCompanyMonthRevenue, "partnerOwnerRevenueThisMonth": partnerOwnerMonthRevenue, "unpaidInvoices": unpaid, "totalCustomers": len(s.customers), "totalPartners": len(s.partners)})
}

func (s *Store) handleRevenue(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	items := []map[string]any{}
	for _, tx := range s.transactions {
		items = append(items, map[string]any{"period": tx.CreatedAt.Format("2006-01-02"), "revenue": tx.PaidAmount, "bookingCount": 1})
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Store) handleVehicleReport(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	items := []map[string]any{}
	for _, v := range s.vehicles {
		totalBookings, utilDays := 0, 0
		totalRevenue := 0.0
		for _, b := range s.bookings {
			if b.VehicleID == v.ID {
				totalBookings++
				totalRevenue += b.TotalAmount
				utilDays += int(math.Max(1, math.Ceil(b.EndDate.Sub(b.StartDate).Hours()/24)))
			}
		}
		items = append(items, map[string]any{"vehicleId": v.ID, "vehicleName": v.Name, "plateNumber": v.PlateNumber, "ownership": v.Ownership, "totalBookings": totalBookings, "totalRevenue": totalRevenue, "utilizationDays": utilDays, "utilizationPercent": utilDays * 10})
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Store) handlePartnerReport(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	items := []map[string]any{}
	for _, v := range s.vehicles {
		if v.Ownership != "external" {
			continue
		}
		share := 70.0
		if v.ProfitSharePercent != nil {
			share = *v.ProfitSharePercent
		}
		totalRevenue, opCost := 0.0, 0.0
		for _, b := range s.bookings {
			if b.VehicleID == v.ID {
				totalRevenue += b.TotalAmount
				opCost += b.WashFee + b.DamageFee
			}
		}
		net := totalRevenue - opCost
		partnerShare := net * share / 100
		items = append(items, map[string]any{"vehicleId": v.ID, "vehicleName": v.Name, "plateNumber": v.PlateNumber, "partnerName": derefString(v.PartnerName, "Mitra"), "totalRevenue": totalRevenue, "operationalCost": opCost, "netRevenue": net, "partnerShare": partnerShare, "companyShare": net - partnerShare, "profitSharePercent": share})
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Store) handleRecentActivity(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	items := append([]Activity{}, s.activities...)
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	if len(items) > limit {
		items = items[:limit]
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Store) addActivity(kind, desc string, relatedID int) {
	related := relatedID
	s.activities = append(s.activities, Activity{ID: s.nextActivityID, Type: kind, Description: desc, RelatedID: &related, CreatedAt: time.Now()})
	s.nextActivityID++
}

func (s *Store) currentUser(r *http.Request) (User, bool) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return User{}, false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	uid, ok := s.sessions[cookie.Value]
	if !ok {
		return User{}, false
	}
	for _, user := range s.users {
		if user.ID == uid {
			return user, true
		}
	}
	return User{}, false
}

func sanitizeUser(u User) map[string]any {
	return map[string]any{"id": u.ID, "username": u.Username, "name": u.Name, "role": u.Role, "active": u.Active, "createdAt": u.CreatedAt}
}
func floatPtr(v float64) *float64    { return &v }
func timePtr(v time.Time) *time.Time { return &v }
func derefString(value *string, fallback string) string {
	if value == nil {
		return fallback
	}
	return *value
}
func (s *Store) findVehicle(id int) *Vehicle {
	for i := range s.vehicles {
		if s.vehicles[i].ID == id {
			return &s.vehicles[i]
		}
	}
	return nil
}
func (s *Store) findVehicleIndex(id int) int {
	for i, v := range s.vehicles {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func (s *Store) findCustomer(id int) *Customer {
	for i := range s.customers {
		if s.customers[i].ID == id {
			return &s.customers[i]
		}
	}
	return nil
}
func (s *Store) findCustomerIndex(id int) int {
	for i, v := range s.customers {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func (s *Store) findBooking(id int) *Booking {
	for i := range s.bookings {
		if s.bookings[i].ID == id {
			return &s.bookings[i]
		}
	}
	return nil
}
func (s *Store) findBookingIndex(id int) int {
	for i, v := range s.bookings {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func (s *Store) findTransactionIndex(id int) int {
	for i, v := range s.transactions {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func (s *Store) findUserIndex(id int) int {
	for i, v := range s.users {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func (s *Store) findPartnerIndex(id int) int {
	for i, v := range s.partners {
		if v.ID == id {
			return i
		}
	}
	return -1
}
func applyVehiclePatch(v *Vehicle, body map[string]any) {
	if x, ok := body["name"].(string); ok {
		v.Name = x
	}
	if x, ok := body["plateNumber"].(string); ok {
		v.PlateNumber = x
	}
	if x, ok := body["color"].(string); ok {
		v.Color = x
	}
	if x, ok := body["status"].(string); ok {
		v.Status = x
	}
	if x, ok := body["ownership"].(string); ok {
		v.Ownership = x
	}
}
func applyCustomerPatch(c *Customer, body map[string]any) {
	if x, ok := body["name"].(string); ok {
		c.Name = x
	}
	if x, ok := body["phone"].(string); ok {
		c.Phone = x
	}
	if x, ok := body["address"].(string); ok {
		c.Address = &x
	}
}
func applyBookingPatch(b *Booking, body map[string]any) {
	if x, ok := body["status"].(string); ok {
		b.Status = x
	}
	if x, ok := body["rentalType"].(string); ok {
		b.RentalType = x
	}
	if x, ok := body["pickupDropoffFee"].(float64); ok {
		b.PickupDropoffFee = x
		b.TotalAmount = b.BaseAmount + b.PickupDropoffFee + b.LateFee + b.WashFee + b.DamageFee + b.OtherFee
	}
}
func methodNotAllowed(w http.ResponseWriter) {
	writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
}
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return false
	}
	return true
}
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
func randomToken() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
