// import { Outlet } from 'react-router-dom'
// import Sidebar from './Sidebar'

// export default function Layout() {
//   return (
//     <div className="flex h-screen overflow-hidden">
//       <Sidebar />
//       <main className="flex-1 ml-64 overflow-y-auto">
//         <Outlet />
//       </main>
//     </div>
//   )
// }
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex justify-center">
        
        {/* Page Container */}
        <div className="w-full max-w-7xl px-6 py-6">
          <Outlet />
        </div>

      </main>

    </div>
  )
}