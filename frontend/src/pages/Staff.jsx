import { useState, useEffect } from "react";
import {
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  createCheckoutSession,
} from "../service/api";
import "../styles/staff.css";

function Staff() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    role: "Bartender",
    contract: "full-time",
    hourly_rate: "",
    hours_worked: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.hourly_rate || !form.hours_worked) {
      alert("Please fill in all fields");
      return;
    }
    try {
      if (editingId) {
        await updateEmployee(editingId, {
          ...form,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked),
        });
        setEditingId(null);
      } else {
        await createEmployee({
          ...form,
          hourly_rate: parseFloat(form.hourly_rate),
          hours_worked: parseFloat(form.hours_worked),
        });
      }
      setForm({
        name: "",
        role: "Bartender",
        contract: "full-time",
        hourly_rate: "",
        hours_worked: "",
      });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
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
    });
    setShowForm(true);
  };

  const handlePay = async (emp) => {
    const calculatePay = (e) => {
      const base = e.hourly_rate * e.hours_worked;
      if (e.contract === "full-time") return base * 1.1;
      if (e.contract === "part-time") return base;
      if (e.contract === "freelance") return base * 0.8;
      return base;
    };
    try {
      const res = await createCheckoutSession({
        amount: calculatePay(emp),
        description: `Salary for ${emp.name}`,
        employee_name: emp.name,
        employee_role: emp.role,
        contract: emp.contract,
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert("Payment error");
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
              <th>Hours</th>
              <th>Next Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
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
                  <td>{emp.hours_worked}h</td>
                  <td>{getNextMonday()}</td>
                  <td style={{ display: "flex", gap: "0.4rem" }}>
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
