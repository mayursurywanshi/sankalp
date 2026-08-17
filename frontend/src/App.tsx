import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { About } from "./pages/about/About";
import { Home } from "./pages/home/Home";
import { Services } from "./pages/services/Services";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  );
}

export default App;
