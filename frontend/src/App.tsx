import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { About } from "./pages/about/About";
import { ChildDevelopment } from "./pages/child-development/ChildDevelopment";
import { Home } from "./pages/home/Home";
import { OurImpact } from "./pages/our-impact/OurImpact";
import { Services } from "./pages/services/Services";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/child-development" element={<ChildDevelopment />} />
          <Route path="/our-impact" element={<OurImpact />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  );
}

export default App;
