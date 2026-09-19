import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect as reactUseEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Plus,
  Receipt,
  Search,
  Settings,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import "./App.css";
import { api } from "./api.js";

const useEffect = (effect, dependencies) =>
  reactUseEffect(() => {
    void effect();
  }, dependencies);

const ownerNav = [
  ["Dashboard", "/owner", LayoutDashboard],
  ["Properties", "/owner/properties", Building2],
  ["Apartments", "/owner/apartments", Home],
  ["Residents", "/owner/residents", UserRound],
  ["Invoices", "/owner/invoices", Receipt],
  ["Payments", "/owner/payments", CreditCard],
  ["Complaints", "/owner/complaints", ClipboardList],
  ["Analytics", "/owner/analytics", Zap],
];
const residentNav = [
  ["Dashboard", "/resident", LayoutDashboard],
  ["My Apartment", "/resident/apartment", Home],
  ["Rent & Payments", "/resident/payments", CreditCard],
  ["Maintenance", "/resident/providers", Settings],
  ["Complaints", "/resident/complaints", ClipboardList],
  ["Notifications", "/resident/notifications", Bell],
  ["Profile", "/resident/profile", UserRound],
];
const staffNav = [
  ["Dashboard", "/staff", LayoutDashboard],
  ["Assigned Complaints", "/staff/complaints", ClipboardList],
  ["History", "/staff/history", Receipt],
  ["Profile", "/staff/profile", UserRound],
];

function Logo() {
  return (
    <Link className="brand" to="/">
      <span className="mark">
        <Building2 size={17} />
      </span>
      <span>
        suvidha<small>स्मार्ट समुदाय</small>
      </span>
    </Link>
  );
}
function Button({
  children,
  to,
  onClick,
  secondary = false,
  type = "button",
  disabled = false,
}) {
  const Tag = to ? Link : "button";
  return (
    <Tag
      to={to}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={"button " + (secondary ? "outline" : "coral")}
    >
      {children}
    </Tag>
  );
}
function Landing() {
  return (
    <div className="landing">
      <header>
        <Logo />
        <nav>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#why">Why Suvidha</a>
        </nav>
        <Button to="/resident/login" secondary>
          Log in <ArrowRight size={15} />
        </Button>
      </header>
      <section className="hero">
        <div>
          <span className="eyebrow">● Smarter Living. Faster Solutions.</span>
          <h1>
            Apartment rentals, <em>made easier.</em>
          </h1>
          <p>
            Suvidha gives owners the source of truth for apartments, leases and
            rent while residents get a clear, reliable home for payments and
            problems.
          </p>
          <div className="actions">
            <Button to="/owner/register">
              Create owner account <ArrowRight size={16} />
            </Button>
            <Button to="/resident/login" secondary>
              Resident login
            </Button>
          </div>
          <div className="proof">
            OWNERS &nbsp; RESIDENTS &nbsp; STAFF{" "}
            <span>One property, one shared source of truth</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="dashboard-preview">
            <b>September collection</b>
            <hr />
            <small>Owner overview</small>
            <strong>
              ₹4.2L <i>collected this month</i>
            </strong>
            <div className="bars">▂ ▅ ▃ ▆ ▅ ▇ █</div>
            <div className="preview-row">
              <span>●</span>
              <b>
                32 occupied homes<small>8 vacant · 40 total apartments</small>
              </b>
              <em>80%</em>
            </div>
            <div className="preview-row">
              <span>●</span>
              <b>
                Rent invoices generated
                <small>All charges from the database</small>
              </b>
              <em>Live</em>
            </div>
          </div>
          <div className="floating">
            <CheckCircle2 size={17} />
            <b>
              Payment confirmed<small>Receipt ready · B-704</small>
            </b>
          </div>
        </div>
      </section>
      <div className="metrics">
        <b>
          40<small>Apartments managed</small>
        </b>
        <b>
          ₹4.2L<small>Collected this month</small>
        </b>
        <b>
          98%<small>Payment visibility</small>
        </b>
        <b>
          24 hrs<small>Avg. response time</small>
        </b>
      </div>
      <section className="marketing" id="how">
        <span className="eyebrow">The Suvidha loop</span>
        <h2>
          Set it once. <em>See it clearly.</em>
        </h2>
        <p>
          Owner-controlled rent and property data flows directly into the
          resident experience.
        </p>
        <div className="steps">
          {[
            ["01", "Build your property"],
            ["02", "Generate real invoices"],
            ["03", "Resolve what matters"],
          ].map((x) => (
            <article key={x[0]}>
              <span>{x[0]}</span>
              <h3>{x[1]}</h3>
              <p>
                Manage apartments, assign residents, collect rent and keep every
                maintenance issue moving.
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
function AuthForm({ role }) {
  const go = useNavigate();
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: form.get("email"),
        password: form.get("password"),
      };
      const result =
        role === "owner"
          ? await api.ownerLogin(credentials)
          : role === "staff"
            ? await api.staffLogin(credentials)
            : await api.residentLogin(credentials);
      localStorage.setItem("suvidha_token", result.token);
      localStorage.setItem("suvidha_user", JSON.stringify(result.user));
      go(
        role === "owner" ? "/owner" : role === "staff" ? "/staff" : "/resident",
      );
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="login">
      <div className="login-aside">
        <Logo />
        <div>
          <span className="eyebrow">● Suvidha {role} access</span>
          <h1>
            {role === "owner"
              ? "Your property, under control."
              : "A better way to feel at home."}
          </h1>
          <p>
            {role === "owner"
              ? "Manage apartments, residents, rent, invoices and repairs from one secure workspace."
              : "See your apartment, rent and complaint status without chasing updates."}
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <Logo />
        <span className="eyebrow">{role} login</span>
        <h2>Welcome back</h2>
        <p>Sign in to your {role} workspace.</p>
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            placeholder={`${role}@example.com`}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            placeholder="Enter your password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit">
          Continue <ArrowRight size={16} />
        </Button>
        <hr />
        <small>Need another access type?</small>
        <div className="demo">
          {role !== "owner" && <Link to="/owner/login">Owner login</Link>}
          {role !== "resident" && (
            <Link to="/resident/login">Resident login</Link>
          )}
          {role !== "staff" && <Link to="/staff/login">Staff login</Link>}
        </div>
      </form>
    </div>
  );
}
function OwnerRegister() {
  const go = useNavigate();
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.ownerRegister({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
        propertyName: form.get("propertyName"),
        propertyAddress: form.get("propertyAddress"),
      });
      localStorage.setItem("suvidha_token", result.token);
      localStorage.setItem("suvidha_user", JSON.stringify(result.user));
      go("/owner");
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="login">
      <div className="login-aside">
        <Logo />
        <div>
          <span className="eyebrow">● Start with your property</span>
          <h1>
            Turn the keys into a <em>clear system.</em>
          </h1>
          <p>
            Create the owner account that will control your property’s
            apartments, rent and resident access.
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <Logo />
        <span className="eyebrow">Owner registration</span>
        <h2>Create your workspace</h2>
        <p>
          Your property data will be stored in MongoDB and isolated to your
          account.
        </p>
        <div className="fields">
          <label>
            Full name
            <input name="name" required />
          </label>
          <label>
            Phone
            <input name="phone" required />
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="6" required />
        </label>
        <label>
          Property name
          <input name="propertyName" required placeholder="Aster Heights" />
        </label>
        <label>
          Property address
          <textarea name="propertyAddress" required rows="3" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit">
          Create property <ArrowRight size={16} />
        </Button>
        <p className="form-row">
          <span>Already an owner?</span>
          <Link to="/owner/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
function RegistrationForm({ role }) {
  const go = useNavigate();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone"),
      society: form.get("society"),
      ...(role === "resident"
        ? {
            flat: form.get("flat"),
            block: form.get("block"),
            floor: form.get("floor"),
          }
        : { department: form.get("department") }),
    };
    try {
      const result =
        role === "resident"
          ? await api.residentRegister(details)
          : await api.staffRegister(details);
      localStorage.setItem("suvidha_token", result.token);
      localStorage.setItem("suvidha_user", JSON.stringify(result.user));
      setSaved(true);
      setTimeout(() => go(role === "resident" ? "/resident" : "/staff"), 500);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="login">
      <div className="login-aside">
        <Logo />
        <div>
          <span className="eyebrow">● Join Suvidha</span>
          <h1>
            {role === "resident"
              ? "A simpler way to feel at home."
              : "Keep every fix moving forward."}
          </h1>
          <p>
            {role === "resident"
              ? "Create your resident account to track rent, apartment details and complaints."
              : "Create a maintenance account to receive and update assigned problems."}
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <Logo />
        <span className="eyebrow">
          {role === "resident" ? "Resident registration" : "Staff registration"}
        </span>
        <h2>Create your account</h2>
        <p>Your account details are stored securely in MongoDB.</p>
        <div className="fields">
          <label>
            Full name
            <input name="name" required />
          </label>
          <label>
            Phone
            <input name="phone" required />
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="6" required />
        </label>
        <label>
          Society / Property
          <input name="society" required placeholder="Aster Heights" />
        </label>
        {role === "resident" ? (
          <div className="fields">
            <label>
              Flat number
              <input name="flat" required placeholder="B-704" />
            </label>
            <label>
              Block
              <input name="block" placeholder="B" />
            </label>
            <label>
              Floor
              <input name="floor" placeholder="7" />
            </label>
          </div>
        ) : (
          <label>
            Department
            <input
              name="department"
              required
              placeholder="Plumbing, Electrical or General"
            />
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        {saved && (
          <p className="form-success">Account created. Redirecting...</p>
        )}
        <Button type="submit">
          Create account <ArrowRight size={16} />
        </Button>
        <p className="form-row">
          <span>Already registered?</span>
          <Link to={role === "resident" ? "/resident/login" : "/staff/login"}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
function Shell({ role = "owner", children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav =
    role === "owner" ? ownerNav : role === "staff" ? staffNav : residentNav;
  const user = JSON.parse(localStorage.getItem("suvidha_user") || "{}");
  return (
    <div className="shell">
      <aside className={open ? "open" : ""}>
        <div className="side-top">
          <Logo />
          <button onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="workspace">
          <span>
            {(user.name || (role === "owner" ? "Owner" : "Resident"))
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <b>
            {user.name || (role === "owner" ? "Property owner" : "Resident")}
            <small>
              {role === "owner"
                ? "Owner workspace"
                : role === "staff"
                  ? "Maintenance staff"
                  : `${user.flat || "Assigned apartment"}`}
            </small>
          </b>
        </div>
        <small className="label">Workspace</small>
        {nav.map(([name, path, Icon]) => (
          <Link
            className={location.pathname === path ? "active" : ""}
            to={path}
            onClick={() => setOpen(false)}
            key={path}
          >
            <Icon size={17} />
            {name}
          </Link>
        ))}
        <div className="help">
          <LifeBuoy size={18} />
          <b>
            Need a hand?<small>Talk to support</small>
          </b>
        </div>
        <div className="side-user">
          <span>{(user.name || "SU").slice(0, 2).toUpperCase()}</span>
          <b>
            {user.name || "Suvidha user"}
            <small>{role}</small>
          </b>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="hamb" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <Logo />
          <span />
          <Bell size={19} />
          <b className="top-avatar">
            {(user.name || "SU").slice(0, 2).toUpperCase()}
          </b>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
function Header({ title, desc, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">Suvidha workspace</span>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}
function StatCards({ cards }) {
  return (
    <div className="stats">
      {cards.map((card, index) => (
        <div className={"stat s" + index} key={card[0]}>
          <small>{card[0]}</small>
          <strong>{card[1]}</strong>
          <span>{card[2]}</span>
        </div>
      ))}
    </div>
  );
}
function OwnerDashboard() {
  const [property, setProperty] = useState(null);
  const [summary, setSummary] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api.properties().then((properties) => {
      const current = properties[0];
      setProperty(current);
      if (current) api.propertySummary(current._id).then(setSummary);
    });
    api
      .apartments()
      .then(setApartments)
      .catch(() => {});
    api
      .invoices()
      .then(setInvoices)
      .catch(() => {});
  }, []);
  const collected = invoices
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + item.total, 0);
  const expected = invoices.reduce((sum, item) => sum + item.total, 0);
  return (
    <Shell>
      <Header
        title="Owner dashboard"
        desc={
          property
            ? `${property.name} · ${property.address}`
            : "Create your property to start managing apartments."
        }
        action={
          <Button to="/owner/apartments">
            <Plus size={16} /> Add apartment
          </Button>
        }
      />
      <StatCards
        cards={[
          [
            "Total apartments",
            summary?.totalApartments ?? apartments.length,
            "From MongoDB",
          ],
          [
            "Occupied",
            summary?.occupied ??
              apartments.filter((x) => x.status === "Occupied").length,
            "Active leases",
          ],
          [
            "Vacant",
            summary?.vacant ??
              apartments.filter((x) => x.status !== "Occupied").length,
            "Ready to assign",
          ],
          [
            "Expected rent",
            `₹${(summary?.expectedRent ?? expected).toLocaleString("en-IN")}`,
            "Current invoices",
          ],
          [
            "Collected",
            `₹${collected.toLocaleString("en-IN")}`,
            "Paid invoices",
          ],
          [
            "Pending",
            `₹${Math.max(expected - collected, 0).toLocaleString("en-IN")}`,
            "Needs follow-up",
          ],
        ]}
      />
      <div className="admin-grid">
        <section className="panel insight-card recurring">
          <span className="eyebrow">Rent collection</span>
          <h2>
            {invoices.length
              ? `${Math.round((collected / expected) * 100) || 0}% collected`
              : "No invoices yet"}
          </h2>
          <p>
            Generate monthly invoices after assigning residents. Every amount is
            calculated from apartment charges.
          </p>
          <Button to="/owner/invoices" secondary>
            Manage invoices
          </Button>
        </section>
        <section className="panel insight-card predictive">
          <span className="eyebrow">Owner source of truth</span>
          <h2>{apartments.length} apartments configured</h2>
          <p>
            Resident dashboards read their assigned flat and invoice records
            directly from the backend.
          </p>
          <Button to="/owner/residents" secondary>
            Assign residents
          </Button>
        </section>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Latest apartments</h2>
          <Link to="/owner/apartments">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ApartmentTable apartments={apartments.slice(0, 6)} />
      </section>
    </Shell>
  );
}
function ApartmentTable({ apartments }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Apartment</th>
            <th>Resident</th>
            <th>Rent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {apartments.map((apartment) => (
            <tr key={apartment._id}>
              <td>
                <b>
                  {apartment.name ||
                    `${apartment.block} · ${apartment.flatNumber}`}
                </b>
                <small>
                  {apartment.block} · Flat {apartment.flatNumber} · Floor{" "}
                  {apartment.floor || "—"}
                </small>
              </td>
              <td>{apartment.resident?.name || "Vacant"}</td>
              <td>₹{apartment.monthlyRent?.toLocaleString("en-IN")}</td>
              <td>
                <span className={"status " + apartment.status.toLowerCase()}>
                  {apartment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function OwnerApartments() {
  const [apartments, setApartments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState("");
  const load = () => {
    api
      .apartments()
      .then(setApartments)
      .catch((error) => setMessage(error.message));
    api
      .properties()
      .then(setProperties)
      .catch((error) => setMessage(error.message));
  };
  useEffect(load, []);
  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.createApartment({
        property: form.get("property"),
        name: form.get("name"),
        block: form.get("block"),
        flatNumber: form.get("flatNumber"),
        floor: form.get("floor"),
        bedrooms: Number(form.get("bedrooms")),
        monthlyRent: Number(form.get("monthlyRent")),
        securityDeposit: Number(form.get("securityDeposit") || 0),
        maintenanceCharge: Number(form.get("maintenanceCharge") || 0),
        waterCharge: Number(form.get("waterCharge") || 0),
        parkingCharge: Number(form.get("parkingCharge") || 0),
      });
      formElement.reset();
      setMessage("Apartment saved to MongoDB.");
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <Shell>
      <Header
        title="Apartments"
        desc="Create flats and set the charges that drive resident invoices."
      />
      <div className="two-col">
        <form className="panel report" onSubmit={submit}>
          <h3>Add apartment</h3>
          <label>
            Property
            <select name="property" required>
              {properties.length ? (
                properties.map((property) => (
                  <option value={property._id} key={property._id}>
                    {property.name}
                  </option>
                ))
              ) : (
                <option value="">Create a property first</option>
              )}
            </select>
            {!properties.length && (
              <Link className="form-link" to="/owner/properties">
                Create a property now <ArrowRight size={12} />
              </Link>
            )}
          </label>
          <label>
            Apartment name
            <input name="name" required placeholder="Sunrise Residency A-101" />
          </label>
          <div className="fields">
            <label>
              Block
              <input name="block" required />
            </label>
            <label>
              Flat number
              <input name="flatNumber" required placeholder="A-101" />
            </label>
            <label>
              Floor
              <input name="floor" />
            </label>
            <label>
              Bedrooms
              <input name="bedrooms" type="number" min="0" defaultValue="1" />
            </label>
            <label>
              Monthly rent
              <input name="monthlyRent" type="number" min="0" required />
            </label>
            <label>
              Security deposit
              <input name="securityDeposit" type="number" min="0" />
            </label>
            <label>
              Maintenance
              <input name="maintenanceCharge" type="number" min="0" />
            </label>
            <label>
              Water charge
              <input name="waterCharge" type="number" min="0" />
            </label>
            <label>
              Parking charge
              <input name="parkingCharge" type="number" min="0" />
            </label>
          </div>
          {message && <p className="form-error">{message}</p>}
          <Button type="submit" disabled={!properties.length}>
            <Plus size={15} /> Save apartment
          </Button>
        </form>
        <section className="panel">
          <div className="panel-head">
            <h2>Property inventory</h2>
            <span>{apartments.length} total</span>
          </div>
          <ApartmentTable apartments={apartments} />
        </section>
      </div>
    </Shell>
  );
}
function OwnerResidents() {
  const [apartments, setApartments] = useState([]);
  const [message, setMessage] = useState("");
  const load = () =>
    api
      .apartments()
      .then(setApartments)
      .catch((error) => setMessage(`Cannot load apartments: ${error.message}`));
  useEffect(load, []);
  const vacantApartments = apartments.filter(
    (item) => item.status === "Vacant" && !item.resident,
  );
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.assignResident(form.get("apartment"), {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        leaseStart: form.get("leaseStart"),
        leaseEnd: form.get("leaseEnd"),
        moveInDate: form.get("moveInDate"),
      });
      setMessage("Resident account created or updated and apartment assigned.");
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <Shell>
      <Header
        title="Residents"
        desc="Assign residents to apartments and create their login access."
      />
      <div className="two-col">
        <form className="panel report" onSubmit={submit}>
          <h3>Assign resident</h3>
          <label>
            Vacant apartment
            <select
              name="apartment"
              required
              disabled={!vacantApartments.length}
            >
              {vacantApartments.length ? (
                vacantApartments.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name || `${item.block} · ${item.flatNumber}`}
                  </option>
                ))
              ) : (
                <option value="">No vacant apartments available</option>
              )}
            </select>
            {!vacantApartments.length && (
              <Link className="form-link" to="/owner/apartments">
                Add a vacant apartment <ArrowRight size={12} />
              </Link>
            )}
          </label>
          <div className="fields">
            <label>
              Resident name
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Phone
              <input name="phone" />
            </label>
            <label>
              Move-in date
              <input name="moveInDate" type="date" />
            </label>
            <label>
              Lease start
              <input name="leaseStart" type="date" required />
            </label>
            <label>
              Lease end
              <input name="leaseEnd" type="date" />
            </label>
          </div>
          {message && <p className="form-error">{message}</p>}
          <Button type="submit" disabled={!vacantApartments.length}>
            <UserRound size={15} /> Create resident access
          </Button>
        </form>
        <section className="panel">
          <div className="panel-head">
            <h2>Assigned residents</h2>
            <span>Private by property</span>
          </div>
          <ApartmentTable
            apartments={apartments.filter((item) => item.resident)}
          />
        </section>
      </div>
    </Shell>
  );
}
function OwnerInvoices() {
  const [properties, setProperties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api.properties().then(setProperties);
    api
      .invoices()
      .then(setInvoices)
      .catch(() => {});
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.generateInvoices({
        property: form.get("property"),
        period: form.get("period"),
        dueDate: form.get("dueDate"),
        lateFee: Number(form.get("lateFee") || 0),
      });
      setMessage(
        `${result.generated} invoice(s) generated from apartment charges.`,
      );
      api.invoices().then(setInvoices);
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <Shell>
      <Header
        title="Invoices"
        desc="Generate monthly rent from database-backed apartment charges."
      />
      <form className="panel report" onSubmit={submit}>
        <h3>Generate monthly invoices</h3>
        <div className="fields">
          <label>
            Property
            <select name="property" required>
              {properties.map((property) => (
                <option value={property._id} key={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Period
            <input name="period" required placeholder="September 2026" />
          </label>
          <label>
            Due date
            <input name="dueDate" type="date" required />
          </label>
          <label>
            Late fee
            <input name="lateFee" type="number" min="0" defaultValue="0" />
          </label>
        </div>
        {message && <p className="form-error">{message}</p>}
        <Button type="submit">
          <Receipt size={15} /> Generate invoices
        </Button>
      </form>
      <section className="panel">
        <div className="panel-head">
          <h2>Invoice history</h2>
          <span>{invoices.length} records</span>
        </div>
        <InvoiceTable invoices={invoices} />
      </section>
    </Shell>
  );
}
function InvoiceTable({ invoices }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Resident / Flat</th>
            <th>Period</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td>
                <b>{invoice.invoiceNumber}</b>
                <small>
                  Due {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
                </small>
              </td>
              <td>
                {invoice.resident?.name || "Resident"}
                <small>
                  {invoice.apartment?.block} · {invoice.apartment?.flatNumber}
                </small>
              </td>
              <td>{invoice.period}</td>
              <td>₹{invoice.total?.toLocaleString("en-IN")}</td>
              <td>
                <Status value={invoice.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Status({ value }) {
  return <span className={"status " + value.toLowerCase()}>{value}</span>;
}
function ResidentDashboard() {
  const [user, setUser] = useState({});
  const [apartments, setApartments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api.me().then((result) => setUser(result.user));
    api
      .apartments()
      .then(setApartments)
      .catch(() => {});
    api
      .invoices()
      .then(setInvoices)
      .catch(() => {});
  }, []);
  const apartment = apartments[0];
  const pending = invoices.find((invoice) => invoice.status !== "PAID");
  return (
    <Shell role="resident">
      <Header
        title={`Welcome home${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        desc={
          apartment
            ? `${apartment.property?.name || user.society} · ${apartment.block} · ${apartment.flatNumber}`
            : "Your assigned apartment and rent will appear here."
        }
        action={
          <Button to="/resident/complaints">
            <Plus size={16} /> Report a problem
          </Button>
        }
      />
      <StatCards
        cards={[
          [
            "Current rent",
            pending ? `₹${pending.total.toLocaleString("en-IN")}` : "—",
            pending?.period || "No invoice",
          ],
          [
            "Due date",
            pending
              ? new Date(pending.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "—",
            pending?.status || "Up to date",
          ],
          [
            "Paid invoices",
            invoices.filter((item) => item.status === "PAID").length,
            "Payment history",
          ],
          [
            "Apartment",
            apartment ? `${apartment.block} · ${apartment.flatNumber}` : "—",
            user.leaseEnd
              ? `Lease to ${new Date(user.leaseEnd).toLocaleDateString("en-IN")}`
              : "Assigned home",
          ],
        ]}
      />
      <div className="quick-actions">
        <Link to="/resident/payments">
          <CreditCard size={17} />
          <b>
            Pay rent<small>View current invoice</small>
          </b>
        </Link>
        <Link to="/resident/apartment">
          <Home size={17} />
          <b>
            My apartment<small>Charges and lease</small>
          </b>
        </Link>
        <Link to="/resident/complaints">
          <ClipboardList size={17} />
          <b>
            Report a problem<small>Track resolution</small>
          </b>
        </Link>
        <Link to="/resident/notifications">
          <Bell size={17} />
          <b>
            Notifications<small>Payment and property updates</small>
          </b>
        </Link>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Current invoice</h2>
          <Link to="/resident/payments">
            View payment history <ArrowRight size={14} />
          </Link>
        </div>
        {pending ? (
          <InvoiceDetail invoice={pending} />
        ) : (
          <div className="empty-state">
            <CheckCircle2 size={22} /> No pending invoices.
          </div>
        )}
      </section>
    </Shell>
  );
}
function InvoiceDetail({ invoice }) {
  return (
    <div className="invoice-detail">
      <div>
        {invoice.lineItems?.map((item) => (
          <p key={item.label}>
            <span>{item.label}</span>
            <b>₹{item.amount.toLocaleString("en-IN")}</b>
          </p>
        ))}
      </div>
      <div className="invoice-total">
        <small>Total due</small>
        <strong>₹{invoice.total.toLocaleString("en-IN")}</strong>
        <Status value={invoice.status} />
        {invoice.property?.paymentQrCode && (
          <div className="payment-qr">
            <img
              src={invoice.property.paymentQrCode}
              alt="Owner payment QR code"
            />
            <small>Scan to pay the owner</small>
          </div>
        )}
      </div>
    </div>
  );
}
function ResidentPaymentsQr() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api
      .invoices()
      .then(setInvoices)
      .catch((error) => setMessage(error.message));
  }, []);
  return (
    <Shell role="resident">
      <Header
        title="Rent & payments"
        desc="Scan the owner’s QR code to pay your invoice."
      />
      {message && (
        <div className="payment-note">
          <Bell size={17} />
          <span>{message}</span>
        </div>
      )}
      <section className="panel payment-panel">
        <div className="panel-head">
          <h2>Invoice history</h2>
          <span>{invoices.length} invoices</span>
        </div>
        {invoices.length ? (
          <div className="payment-list">
            {invoices.map((invoice) => (
              <div className="payment-row" key={invoice._id}>
                <div className="payment-icon">
                  <CreditCard size={16} />
                </div>
                <div>
                  <b>{invoice.period}</b>
                  <small>
                    {invoice.invoiceNumber} · Due{" "}
                    {new Date(invoice.dueDate).toLocaleDateString("en-IN")}
                  </small>
                </div>
                <strong>₹{invoice.total.toLocaleString("en-IN")}</strong>
                <Status value={invoice.status} />
                {invoice.status === "PAID" ? (
                  <button className="receipt">View receipt</button>
                ) : (
                  <Button onClick={() => setSelectedInvoice(invoice)}>
                    Pay now <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No invoices have been generated for your apartment yet.
          </div>
        )}
      </section>
      {selectedInvoice && (
        <div className="qr-overlay">
          <section className="panel qr-modal">
            <button
              className="qr-close"
              onClick={() => setSelectedInvoice(null)}
            >
              ×
            </button>
            <span className="eyebrow">Secure payment</span>
            <h2>Scan to pay rent</h2>
            <p>
              {selectedInvoice.period} · ₹
              {selectedInvoice.total.toLocaleString("en-IN")}
            </p>
            {selectedInvoice.property?.paymentQrCode ? (
              <>
                <img
                  src={selectedInvoice.property.paymentQrCode}
                  alt="Owner payment QR code"
                />
                <small>
                  Scan this QR using your UPI app. Your owner will confirm the
                  payment.
                </small>
              </>
            ) : (
              <div className="empty-state">
                The owner has not uploaded a payment QR code yet.
              </div>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
function ResidentApartment() {
  const [apartments, setApartments] = useState([]);
  useEffect(() => {
    api
      .apartments()
      .then(setApartments)
      .catch(() => {});
  }, []);
  const apartment = apartments[0];
  return (
    <Shell role="resident">
      <Header
        title="My apartment"
        desc="Your home, lease and owner-controlled charges."
      />
      {apartment ? (
        <section className="panel detail">
          <h2>
            {apartment.property?.name} · {apartment.block} ·{" "}
            {apartment.flatNumber}
          </h2>
          <p>
            {apartment.bedrooms} bedroom {apartment.flatType} on floor{" "}
            {apartment.floor || "—"}.
          </p>
          <div className="facts">
            <b>
              Monthly rent
              <small>₹{apartment.monthlyRent.toLocaleString("en-IN")}</small>
            </b>
            <b>
              Maintenance
              <small>
                ₹{apartment.maintenanceCharge.toLocaleString("en-IN")}
              </small>
            </b>
            <b>
              Security deposit
              <small>
                ₹{apartment.securityDeposit.toLocaleString("en-IN")}
              </small>
            </b>
          </div>
        </section>
      ) : (
        <section className="panel empty-state">
          No apartment is assigned to this account.
        </section>
      )}
    </Shell>
  );
}
function compressQrImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = Math.min(Math.max(image.width, image.height), 1200);
        const scale = size / Math.max(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function OwnerProperties() {
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState("");
  const load = () =>
    api
      .properties()
      .then(setProperties)
      .catch((error) =>
        setMessage(
          `Cannot load properties: ${error.message}. Make sure the backend and MongoDB are running.`,
        ),
      );
  useEffect(load, []);
  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const qrFile = form.get("paymentQrCode");
    try {
      let paymentQrCode = "";
      if (qrFile?.size) {
        if (!qrFile.type.startsWith("image/") || qrFile.size > 8 * 1024 * 1024)
          throw new Error("Choose an image smaller than 8 MB");
        paymentQrCode = await compressQrImage(qrFile);
        if (paymentQrCode.length > 5 * 1024 * 1024)
          throw new Error(
            "QR image is still too large. Choose a smaller image",
          );
      }
      await api.createProperty({
        name: form.get("name"),
        address: form.get("address"),
        paymentQrCode,
      });
      formElement.reset();
      setMessage("Property and payment QR saved to MongoDB.");
      load();
    } catch (error) {
      setMessage(
        `Property was not saved: ${error.message}. Check the backend connection.`,
      );
    }
  };
  return (
    <Shell>
      <Header
        title="Properties"
        desc="Each property has its own apartments, residents, invoices and reports."
      />
      <div className="two-col">
        <form className="panel report" onSubmit={submit}>
          <h3>Add property</h3>
          <label>
            Property name
            <input name="name" required placeholder="Sunrise Residency" />
          </label>
          <label>
            Property address
            <textarea
              name="address"
              rows="4"
              required
              placeholder="Enter the complete property address"
            />
          </label>
          <label>
            Payment QR code
            <input
              name="paymentQrCode"
              type="file"
              accept="image/png,image/jpeg,image/webp"
            />
            <small className="field-hint">
              Optional. Large QR images are compressed before upload.
            </small>
          </label>
          {message && <p className="form-error">{message}</p>}
          <Button type="submit">
            <Plus size={15} /> Save property
          </Button>
        </form>
        <section className="panel">
          <div className="panel-head">
            <h2>Your properties</h2>
            <span>{properties.length} properties</span>
          </div>
          {properties.map((property) => (
            <div className="notice" key={property._id}>
              <Building2 size={16} />
              <b>
                {property.name}
                <small>
                  {property.address} ·{" "}
                  {property.paymentQrCode
                    ? "Payment QR added"
                    : "No payment QR"}
                </small>
              </b>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}
function ComplaintsPage({ role = "resident" }) {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const load = () =>
    api
      .complaints()
      .then(setComplaints)
      .catch((error) => setMessage(error.message));
  useEffect(load, []);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createComplaint({
        title: form.get("title"),
        description: form.get("description"),
        category: form.get("category"),
        flat: form.get("flat"),
        location: form.get("location"),
        priority: form.get("priority"),
      });
      setMessage("Complaint created.");
      event.currentTarget.reset();
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <Shell role={role}>
      <Header
        title={role === "staff" ? "Assigned complaints" : "Complaints"}
        desc={
          role === "staff"
            ? "Only problems assigned to your staff account appear here."
            : "Report and track apartment issues."
        }
      />
      {role === "resident" && (
        <form className="panel report" onSubmit={submit}>
          <h3>Report a problem</h3>
          <div className="fields">
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Category
              <select name="category" defaultValue="Plumbing">
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Lift</option>
                <option>Cleaning</option>
                <option>Water</option>
                <option>Parking</option>
                <option>Security</option>
                <option>Structural</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Flat
              <input name="flat" required />
            </label>
            <label>
              Location
              <input name="location" />
            </label>
          </div>
          <label>
            Description
            <textarea name="description" rows="4" required />
          </label>
          <label>
            Priority
            <select name="priority" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Emergency</option>
            </select>
          </label>
          {message && <p className="form-error">{message}</p>}
          <Button type="submit">
            <Plus size={15} /> Submit complaint
          </Button>
        </form>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>Problem history</h2>
          <span>{complaints.length} records</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Category</th>
                <th>Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr key={item._id}>
                  <td>
                    <b>{item.title}</b>
                    <small>
                      {item.complaintId} · {item.flat}
                    </small>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td>{item.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
const providerCategories = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "AC Technician",
  "Washing Machine Technician",
  "Refrigerator Technician",
  "Internet/Wi-Fi Technician",
  "Pest Control",
  "Cleaning Service",
  "Security/Other",
];
function ProviderForm({ onSaved }) {
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api.createServiceProvider({
        name: form.get("name"),
        phone: form.get("phone"),
        category: form.get("category"),
        areaServed: form.get("areaServed"),
        description: form.get("description"),
        rating: form.get("rating") ? Number(form.get("rating")) : undefined,
        review: form.get("review"),
      });
      formElement.reset();
      setMessage("Service provider added.");
      onSaved();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <form className="panel provider-form" onSubmit={submit}>
      <div className="panel-head">
        <h2>Add service provider</h2>
        <span>Share a trusted contact</span>
      </div>
      <div className="fields">
        <label>
          Provider name
          <input name="name" required placeholder="Raj Plumbing Services" />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            required
            inputMode="tel"
            pattern="[+\d][\d\s().-]{7,19}"
            placeholder="9876543210"
          />
        </label>
        <label>
          Service category
          <select name="category" required defaultValue="">
            <option value="">Select a category</option>
            {providerCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Flat / area served
          <input name="areaServed" placeholder="Block B · All floors" />
        </label>
        <label>
          Rating
          <input
            name="rating"
            type="number"
            min="1"
            max="5"
            step=".1"
            placeholder="4.5"
          />
        </label>
        <label>
          Review
          <input name="review" placeholder="Optional short review" />
        </label>
      </div>
      <label>
        Short description
        <textarea
          name="description"
          rows="3"
          placeholder="Available for bathroom and kitchen plumbing issues"
        />
      </label>
      {message && <p className="form-error">{message}</p>}
      <Button type="submit">
        <Plus size={15} /> Add provider
      </Button>
    </form>
  );
}
function ProviderCard({ provider, onChanged }) {
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("suvidha_user") || "{}");
  const ownListing =
    provider.addedBy?._id === user.id || provider.addedBy?.id === user.id;
  const report = async () => {
    const reason = window.prompt(
      "Why is this provider information incorrect or inappropriate?",
    );
    if (!reason) return;
    try {
      await api.reportServiceProvider(provider._id, reason);
      setMessage("Report submitted for review.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${provider.name}?`)) return;
    try {
      await api.deleteServiceProvider(provider._id);
      onChanged();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <article className="provider-card">
      <div className="provider-card-head">
        <div className="provider-avatar">
          {provider.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h3>{provider.name}</h3>
          <span className="provider-category">{provider.category}</span>
        </div>
      </div>
      <a className="provider-phone" href={`tel:${provider.phone}`}>
        <span>☎</span>
        {provider.phone}
      </a>
      {provider.description && <p>{provider.description}</p>}
      {provider.areaServed && (
        <small className="provider-area">Serves: {provider.areaServed}</small>
      )}
      <div className="provider-meta">
        {provider.rating ? (
          <span>
            ★ {provider.rating.toFixed(1)}
            {provider.review ? ` · ${provider.review}` : ""}
          </span>
        ) : (
          <span>No rating yet</span>
        )}
        <small>Added by {provider.addedBy?.name || "Apartment resident"}</small>
      </div>
      <div className="provider-actions">
        <a className="button coral" href={`tel:${provider.phone}`}>
          Call
        </a>
        {ownListing && (
          <button className="provider-delete" onClick={remove}>
            Delete
          </button>
        )}
        <button className="provider-report" onClick={report}>
          Report
        </button>
      </div>
      {message && <small className="provider-message">{message}</small>}
    </article>
  );
}
function Providers() {
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const load = () =>
    api
      .serviceProviders({
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
      })
      .then(setProviders)
      .catch((error) => setMessage(error.message));
  useEffect(() => {
    api
      .serviceProviders({
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
      })
      .then(setProviders)
      .catch((error) => setMessage(error.message));
  }, [search, category]);
  return (
    <Shell role="resident">
      <Header
        title="Maintenance contacts"
        desc="Trusted service providers shared by residents in your property."
        action={
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus size={16} />{" "}
            {showForm ? "Close form" : "Add service provider"}
          </Button>
        }
      />
      {showForm && (
        <ProviderForm
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
      <div className="provider-toolbar">
        <div>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by provider or category"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All service types</option>
          {providerCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      {message && <p className="form-error">{message}</p>}
      {providers.length ? (
        <div className="provider-grid">
          {providers.map((provider) => (
            <ProviderCard
              key={provider._id}
              provider={provider}
              onChanged={load}
            />
          ))}
        </div>
      ) : (
        <section className="panel empty-state">
          <Settings size={20} />
          <span>
            No service providers found. Add the first trusted contact for your
            community.
          </span>
        </section>
      )}
    </Shell>
  );
}
function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api
      .notifications()
      .then(setItems)
      .catch(() => {});
  }, []);
  return (
    <Shell role="resident">
      <Header
        title="Notifications"
        desc="Invoice, payment and property updates from your owner."
      />
      <section className="panel notices">
        {items.length ? (
          items.map((item) => (
            <div className="notice" key={item._id}>
              <Bell size={16} />
              <b>
                {item.title}
                <small>{item.message}</small>
              </b>
            </div>
          ))
        ) : (
          <div className="empty-state">No notifications yet.</div>
        )}
      </section>
    </Shell>
  );
}
function Simple({ role = "resident", title = "Notifications" }) {
  return (
    <Shell role={role}>
      <Header
        title={title}
        desc="Updates and actions from your Suvidha workspace."
      />
      <section className="panel notices">
        <div className="notice">
          <span>●</span>
          <b>
            Connect your MongoDB workspace to see live records here.
            <small>
              Suvidha keeps property data private by owner and resident
              assignment.
            </small>
          </b>
        </div>
      </section>
    </Shell>
  );
}
function Guard({ roles, children }) {
  const user = JSON.parse(localStorage.getItem("suvidha_user") || "null");
  return user && roles.includes(user.role) ? (
    children
  ) : (
    <Navigate
      to={roles.includes("owner") ? "/owner/login" : "/resident/login"}
      replace
    />
  );
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/owner/login" element={<AuthForm role="owner" />} />
        <Route path="/owner/register" element={<OwnerRegister />} />
        <Route path="/resident/login" element={<AuthForm role="resident" />} />
        <Route
          path="/resident/register"
          element={<RegistrationForm role="resident" />}
        />
        <Route path="/staff/login" element={<AuthForm role="staff" />} />
        <Route
          path="/staff/register"
          element={<RegistrationForm role="staff" />}
        />
        <Route
          path="/login"
          element={<Navigate to="/resident/login" replace />}
        />
        <Route
          path="/owner"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerDashboard />
            </Guard>
          }
        />
        <Route
          path="/owner/properties"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerProperties />
            </Guard>
          }
        />
        <Route
          path="/owner/apartments"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerApartments />
            </Guard>
          }
        />
        <Route
          path="/owner/residents"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerResidents />
            </Guard>
          }
        />
        <Route
          path="/owner/invoices"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerInvoices />
            </Guard>
          }
        />
        <Route
          path="/owner/payments"
          element={
            <Guard roles={["owner", "admin"]}>
              <OwnerInvoices />
            </Guard>
          }
        />
        <Route
          path="/owner/complaints"
          element={
            <Guard roles={["owner", "admin"]}>
              <ComplaintsPage role="owner" />
            </Guard>
          }
        />
        <Route
          path="/owner/analytics"
          element={
            <Guard roles={["owner", "admin"]}>
              <Simple role="owner" title="Analytics" />
            </Guard>
          }
        />
        <Route
          path="/resident"
          element={
            <Guard roles={["resident"]}>
              <ResidentDashboard />
            </Guard>
          }
        />
        <Route
          path="/resident/apartment"
          element={
            <Guard roles={["resident"]}>
              <ResidentApartment />
            </Guard>
          }
        />
        <Route
          path="/resident/payments"
          element={
            <Guard roles={["resident"]}>
              <ResidentPaymentsQr />
            </Guard>
          }
        />
        <Route
          path="/resident/providers"
          element={
            <Guard roles={["resident"]}>
              <Providers />
            </Guard>
          }
        />
        <Route
          path="/resident/complaints"
          element={
            <Guard roles={["resident"]}>
              <ComplaintsPage />
            </Guard>
          }
        />
        <Route
          path="/resident/notifications"
          element={
            <Guard roles={["resident"]}>
              <Notifications />
            </Guard>
          }
        />
        <Route
          path="/resident/profile"
          element={
            <Guard roles={["resident"]}>
              <Simple title="Profile" />
            </Guard>
          }
        />
        <Route
          path="/staff"
          element={
            <Guard roles={["maintenance_staff"]}>
              <Simple role="staff" title="Staff dashboard" />
            </Guard>
          }
        />
        <Route
          path="/staff/complaints"
          element={
            <Guard roles={["maintenance_staff"]}>
              <ComplaintsPage role="staff" />
            </Guard>
          }
        />
        <Route
          path="/staff/history"
          element={
            <Guard roles={["maintenance_staff"]}>
              <ComplaintsPage role="staff" />
            </Guard>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <Guard roles={["maintenance_staff"]}>
              <Simple role="staff" title="Profile" />
            </Guard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
