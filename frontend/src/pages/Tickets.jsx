import { useState, useEffect } from 'react'
import { getTickets, createTicket, sellTickets, deleteTicket } from '../service/api'
import '../styles/tickets.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getUpcomingEvents = () => {
  const today = new Date()
  const events = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayName = DAYS[date.getDay()]
    const dateStr = date.toISOString().split('T')[0]
    events.push({ label: `${dayName} Night Event`, date: dateStr, day: dayName })
  }
  return events
}

function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sellQty, setSellQty] = useState({})
  const [form, setForm] = useState({
    event_name: '', event_date: '', price: '', total_tickets: '', sold_tickets: 0
  })

  const upcomingEvents = getUpcomingEvents()

  useEffect(() => { fetchTickets() }, [])

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
    setForm({ ...form, event_name: event.label, event_date: event.date })
  }

  const handleCreate = async () => {
    if (!form.event_name || !form.event_date || !form.price || !form.total_tickets) {
      alert('Please fill in all fields')
      return
    }
    try {
      await createTicket({ ...form, price: parseFloat(form.price), total_tickets: parseInt(form.total_tickets) })
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

  if (loading) return <div className="tickets-no-data">Loading...</div>

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div className="tickets-title">Entry tickets</div>
        <button
          className={showForm ? 'tickets-cancel-btn' : 'tickets-new-btn'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New event'}
        </button>
      </div>

      {showForm && (
        <div className="tickets-form">
          <div className="tickets-form-title">New event</div>

          <div className="tickets-quick-label">Quick select day</div>
          <div className="tickets-quick-days">
            {upcomingEvents.map(event => (
              <button
                key={event.date}
                className={`tickets-day-btn ${form.event_date === event.date ? 'active' : ''}`}
                onClick={() => handleQuickSelect(event)}
              >
                {event.day}
              </button>
            ))}
          </div>

          <div className="tickets-form-grid">
            <div className="tickets-form-group">
              <label>Event name</label>
              <input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} placeholder="e.g. Friday Night Event" />
            </div>
            <div className="tickets-form-group">
              <label>Event date</label>
              <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div className="tickets-form-group">
              <label>Ticket price (€)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 20" />
            </div>
            <div className="tickets-form-group">
              <label>Total tickets</label>
              <input type="number" value={form.total_tickets} onChange={e => setForm({ ...form, total_tickets: e.target.value })} placeholder="e.g. 200" />
            </div>
          </div>

          <button className="tickets-create-btn" onClick={handleCreate}>Create event</button>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="tickets-no-data">No events yet.</div>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => {
            const remaining = ticket.total_tickets - ticket.sold_tickets
            const percent = Math.round((ticket.sold_tickets / ticket.total_tickets) * 100)
            const revenue = ticket.sold_tickets * ticket.price
            return (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-card-name">{ticket.event_name}</div>

                <div className="ticket-card-row">
                  <span className="ticket-card-label">Date</span>
                  <span className="ticket-card-value">{ticket.event_date}</span>
                </div>
                <div className="ticket-card-row">
                  <span className="ticket-card-label">Price</span>
                  <span className="ticket-card-value">€{ticket.price}</span>
                </div>
                <div className="ticket-card-row">
                  <span className="ticket-card-label">Sold</span>
                  <span className="ticket-card-value">{ticket.sold_tickets} / {ticket.total_tickets}</span>
                </div>
                <div className="ticket-card-row">
                  <span className="ticket-card-label">Remaining</span>
                  <span className="ticket-card-value">{remaining}</span>
                </div>
                <div className="ticket-card-row">
                  <span className="ticket-card-label">Revenue</span>
                  <span className="ticket-card-revenue">€{revenue.toFixed(2)}</span>
                </div>

                <div className="ticket-progress">
                  <div className="ticket-progress-bar" style={{ width: `${percent}%` }} />
                </div>
                <div className="ticket-percent">{percent}% sold</div>

                <div className="ticket-card-divider" />

                <div className="ticket-sell-row">
                  <input
                    className="ticket-sell-input"
                    type="number"
                    min="1"
                    value={sellQty[ticket.id] || ''}
                    onChange={e => setSellQty({ ...sellQty, [ticket.id]: e.target.value })}
                    placeholder="qty"
                  />
                  <button className="ticket-sell-btn" onClick={() => handleSell(ticket.id)}>Sell</button>
                  <button className="ticket-delete-btn" onClick={() => handleDelete(ticket.id, ticket.event_name)}>Delete</button>
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