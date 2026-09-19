import './App.css'
import Header from './components/publicWebsite/Header'
import Hero from './components/publicWebsite/Hero'
import FeaturedProperties from './components/publicWebsite/FeaturedProperties'
import ServicesOverview from './components/publicWebsite/ServicesOverview'
import Footer from './components/publicWebsite/Footer'
import CTASection from './components/publicWebsite/CTASection'  

function App() {
  
    return(
      <>
      <main className='main'>
      <Header/>
      <Hero/>
      <FeaturedProperties/>
      <ServicesOverview/>
      <CTASection/>
      <Footer/>
      </main>
      </>
    )
}

export default App
