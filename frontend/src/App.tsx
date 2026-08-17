import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { About } from "./pages/about/About";
import { Home } from "./pages/home/Home";

function App() {
  return (
    <BrowserRouter>
      <SiteLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  );
}

export default App;
