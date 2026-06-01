import { useState, useEffect } from 'react'
import { getTickets, createTicket, sellTickets, deleteTicket } from '../service/api'
import '../styles/tickets.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getTodayEvents = () => {
  const today = new Date()
  const events = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayName = DAYS[date.getDay()]
    const dateStr = date.toISOString().split('T')[0]
    events.push({
      label: `${dayName} Night Event`,
      date: dateStr,
      day: dayName
    })
  }
  return events
}

function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sellQty, setSellQty] = useState({})
  const [form, setForm] = useState({
    event_name: '',
    event_date: '',
    price: '',
    total_tickets: '',
    sold_tickets: 0
  })

  const upcomingEvents = getTodayEvents()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await getTickets()
      setTickets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (event) => {
    setForm({
      ...form,
      event_name: event.label,
      event_date: event.date
    })
  }

  const handleCreate = async () => {
    if (!form.event_name || !form.event_date || !form.price || !form.total_tickets) {
      alert('Please fill in all fields')
      return
    }
    try {
      await createTicket({
        ...form,
        price: parseFloat(form.price),
        total_tickets: parseInt(form.total_tickets)
      })
      setForm({ event_name: '', event_date: '', price: '', total_tickets: '', sold_tickets: 0 })
      setShowForm(false)
      fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSell = async (id) => {
    const qty = parseInt(sellQty[id] || 1)
    try {
      await sellTickets(id, { quantity: qty })
      setSellQty({ ...sellQty, [id]: '' })
      fetchTickets()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error selling tickets')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete event "${name}"?`)) return
    try {
      await deleteTicket(id)
      fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Entry Tickets</h2>
        <button
          className={`btn ${showForm ? 'btn-grey' : 'btn-green'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <div className="form-wrapper">
          <h3>New Event</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label>Quick Select Day</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '4px' }}>
              {upcomingEvents.map(event => (
                <button
                  key={event.date}
                  className={`btn ${form.event_date === event.date ? 'btn-green' : 'btn-grey'}`}
                  onClick={() => handleQuickSelect(event)}
                >
                  {event.day}
                </button>
              ))}
            </div>
          </div>

          <div className="staff-grid">
            <div>
              <label>Event Name</label>
              <input
                value={form.event_name}
                onChange={e => setForm({ ...form, event_name: e.target.value })}
                placeholder="Auto-filled or type custom"
              />
            </div>
            <div>
              <label>Event Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div>
              <label>Ticket Price (€)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label>Total Tickets</label>
              <input
                type="number"
                value={form.total_tickets}
                onChange={e => setForm({ ...form, total_tickets: e.target.value })}
                placeholder="e.g. 200"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-green" onClick={handleCreate}>
              Create Event
            </button>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <p style={{ color: '#888' }}>No events yet.</p>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => {
            const remaining = ticket.total_tickets - ticket.sold_tickets
            const percent = Math.round((ticket.sold_tickets / ticket.total_tickets) * 100)
            const revenue = ticket.sold_tickets * ticket.price
            return (
              <div key={ticket.id} className="ticket-card">
                <h3>{ticket.event_name}</h3>
                <p>Date: {ticket.event_date}</p>
                <p>Price: €{ticket.price}</p>
                <p>Sold: {ticket.sold_tickets} / {ticket.total_tickets}</p>
                <p>Remaining: {remaining}</p>
                <p>Revenue: €{revenue.toFixed(2)}</p>
                <div className="ticket-progress">
                  <div
                    className="ticket-progress-bar"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: '#888' }}>{percent}% sold</p>
                <div className="ticket-actions">
                  <input
                    type="number"
                    min="1"
                    value={sellQty[ticket.id] || ''}
                    onChange={e => setSellQty({ ...sellQty, [ticket.id]: e.target.value })}
                    placeholder="qty"
                  />
                  <button
                    className="btn btn-green"
                    onClick={() => handleSell(ticket.id)}
                  >
                    Sell
                  </button>
                  <button
                    className="btn btn-red"
                    onClick={() => handleDelete(ticket.id, ticket.event_name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Tickets