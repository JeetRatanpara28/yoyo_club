import { useState, useEffect } from "react";
import {
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  createCheckoutSession,
  registerUser,
  getAllClockSummary,
  getPayments,
  forceClockOut,
  resetTodayHours
} from '../service/api'
import "../styles/staff.css";

function Staff() {
  const [employees, setEmployees] = useState([]);
  const [clockSummary, setClockSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    role: "Bartender",
    contract: "full-time",
    hourly_rate: "",
    hours_worked: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const [empRes, summaryRes, payRes] = await Promise.all([
        getEmployees(),
        getAllClockSummary(),
        getPayments(),
      ]);
      setEmployees(empRes.data);
      setClockSummary(summaryRes.data);
      setPayments(payRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRealHours = (name) => {
    const found = clockSummary.find(
      (s) => s.employee_name.toLowerCase() === name.toLowerCase(),
    );
    return found ? found.total_hours : 0;
  };

  const getRealPay = (emp) => {
    const hours = getRealHours(emp.name);
    const base = hours * emp.hourly_rate;
    if (emp.contract === "full-time") return (base * 1.1).toFixed(2);
    if (emp.contract === "part-time") return base.toFixed(2);
    if (emp.contract === "freelance") return (base * 0.8).toFixed(2);
    return base.toFixed(2);
  };

  const handleAdd = async () => {
    if (
      !editingId &&
      (!form.name ||
        !form.hourly_rate ||
        !form.hours_worked ||
        !form.email ||
        !form.password)
    ) {
      alert("Please fill in all fields");
      return;
    }
    if (editingId && (!form.name || !form.hourly_rate || !form.hours_worked)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      if (editingId) {
        await updateEmployee(editingId, {
          name: form.name,
          role: form.role,
          contract: form.contract,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked),
        });
        setEditingId(null);
      } else {
        await createEmployee({
          name: form.name,
          role: form.role,
          contract: form.contract,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked),
        });
        await registerUser({
          email: form.email,
          password: form.password,
          name: form.name,
        });
      }
      setForm({
        name: "",
        role: "Bartender",
        contract: "full-time",
        hourly_rate: "",
        hours_worked: "",
        email: "",
        password: "",
      });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || "Error creating employee");
    }
  };

  const getNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      role: emp.role,
      contract: emp.contract,
      hourly_rate: emp.hourly_rate,
      hours_worked: emp.hours_worked,
      email: "",
      password: "",
    });
    setShowForm(true);
  };

  const handlePay = async (emp) => {
    const realPay = parseFloat(getRealPay(emp));
    if (realPay === 0) {
      alert("No clock-in hours recorded for this employee yet");
      return;
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const alreadyPaidThisWeek = payments.find((p) => {
      if (p.employee_name.toLowerCase() !== emp.name.toLowerCase())
        return false;
      const parts = p.paid_at.split(",")[0].split("/");
      const paidDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return paidDate >= monday;
    });

    if (alreadyPaidThisWeek) {
      const confirm = window.confirm(
        `Warning: ${emp.name} was already paid €${alreadyPaidThisWeek.amount.toFixed(2)} this week on ${alreadyPaidThisWeek.paid_at}. Do you still want to pay again?`,
      );
      if (!confirm) return;
    }

    try {
      const res = await createCheckoutSession({
        amount: realPay,
        description: `Salary for ${emp.name}`,
        employee_name: emp.name,
        employee_role: emp.role,
        contract: emp.contract,
        employee_id: emp.id,
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert("Payment error");
    }
  };

  const handleForceClockOut = async (emp) => {
    if (!window.confirm(`Force clock out ${emp.name}?`)) return;
    try {
      await forceClockOut(emp.id);
      alert(`${emp.name} has been clocked out`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || "Employee is not clocked in");
    }
  };

  const handleResetHours = async (emp) => {
    if (
      !window.confirm(
        `Remove today's clock hours for ${emp.name}? Only today's record will be deleted.`,
      )
    )
      return;
    try {
      await resetTodayHours(emp.id);
      alert(`Today's hours for ${emp.name} have been removed`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || "No clock record found for today");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Fire ${name}?`)) return;
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Staff</h2>
        <button
          className={`btn ${showForm ? "btn-grey" : "btn-green"}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({
              name: "",
              role: "Bartender",
              contract: "full-time",
              hourly_rate: "",
              hours_worked: "",
              email: "",
              password: "",
            });
          }}
        >
          {showForm ? "Cancel" : "+ Hire"}
        </button>
      </div>

      {showForm && (
        <div className="form-wrapper">
          <h3>{editingId ? "Edit Employee" : "New Employee"}</h3>
          <div className="staff-grid">
            <div>
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marcus Dupont"
              />
            </div>
            {!editingId && (
              <>
                <div>
                  <label>Login Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="e.g. marcus@club.com"
                  />
                </div>
                <div>
                  <label>Login Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="e.g. marcus123"
                  />
                </div>
              </>
            )}
            <div>
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option>Bartender</option>
                <option>DJ</option>
                <option>Bouncer</option>
                <option>Staff</option>
              </select>
            </div>
            <div>
              <label>Contract</label>
              <select
                value={form.contract}
                onChange={(e) => setForm({ ...form, contract: e.target.value })}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label>Hourly Rate (€)</label>
              <input
                type="number"
                value={form.hourly_rate}
                onChange={(e) =>
                  setForm({ ...form, hourly_rate: e.target.value })
                }
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <label>Hours Worked</label>
              <input
                type="number"
                value={form.hours_worked}
                onChange={(e) =>
                  setForm({ ...form, hours_worked: e.target.value })
                }
                placeholder="e.g. 35"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-green" onClick={handleAdd}>
              {editingId ? "Save Changes" : "Confirm Hire"}
            </button>
          </div>
        </div>
      )}

      <div className="staff-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contract</th>
              <th>Hourly Rate</th>
              <th>Real Hours</th>
              <th>Real Pay</th>
              <th>Next Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "#888" }}>
                  No employees yet.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.role}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {emp.contract}
                  </td>
                  <td>€{emp.hourly_rate}/hr</td>
                  <td>{getRealHours(emp.name)}h</td>
                  <td>€{getRealPay(emp)}</td>
                  <td>{getNextMonday()}</td>
                  <td
                    style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                  >
                    <button
                      className="btn btn-grey"
                      onClick={() => handleEdit(emp)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-purple"
                      onClick={() => handlePay(emp)}
                    >
                      Pay
                    </button>
                    <button
                      className="btn btn-grey"
                      onClick={() => handleForceClockOut(emp)}
                    >
                      Stop Clock
                    </button>
                    <button
                      className="btn btn-grey"
                      onClick={() => handleResetHours(emp)}
                    >
                      Reset Hours
                    </button>
                    <button
                      className="btn btn-red"
                      onClick={() => handleDelete(emp.id, emp.name)}
                    >
                      Fire
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Staff;
