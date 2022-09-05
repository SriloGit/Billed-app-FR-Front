/**
 * @jest-environment jsdom
 */

 import { screen, waitFor } from '@testing-library/dom'
 import '@testing-library/jest-dom'
 import userEvent from '@testing-library/user-event'
 import Bills from '../containers/Bills.js'
 import BillsUI from '../views/BillsUI.js'
 import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
 import { localStorageMock } from '../__mocks__/localStorage.js'
 import mockStore from "../__mocks__/store"
 import { bills } from '../fixtures/bills.js'
 import router from '../app/Router.js'

 jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      const classWindowIcon = windowIcon.getAttribute("class")
      expect(classWindowIcon).toEqual("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    
  })

  describe('When I am on Bills page, and I clicked on the "new bill" button', () => {
    test('Then I should be sent on NewBill page', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const handleClickNewBill = jest.fn((e) => newBills.handleClickNewBill())
      const newBillButton = screen.getByTestId('btn-new-bill')
      newBillButton.addEventListener('click', handleClickNewBill)
      userEvent.click(newBillButton)
      expect(handleClickNewBill).toHaveBeenCalled()

      const newBillPage = screen.getByTestId('form-new-bill')
      expect(newBillPage).toBeTruthy()
    })
  })

  describe('When I am on Bills page, and I clicked on the icon eye', () => {
    test('Then a modal should open', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      document.body.innerHTML = BillsUI({ data: bills })

      $.fn.modal = jest.fn();

      const iconEyeList = screen.getAllByTestId('icon-eye');
      let icon1 = iconEyeList[0];
      const spy = jest.fn((e) => newBills.handleClickIconEye(icon1))
      
      if (iconEyeList) {
        icon1.addEventListener('click', spy);
        userEvent.click(icon1);
      }
      
      expect(spy).toHaveBeenCalled()
      const modale = screen.getByTestId('modalFile')
      expect(modale).toBeTruthy()
    })
  })
})

// Test GET
describe('Given I am a user connected as Employee', () => {
  describe('When I navigate to Bills Page', () => {
    test('Then the bills are fetched from the simulated API GET', async () => {
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'a@a' })
      )

      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText('Mes notes de frais'))
      const newBillButton = screen.getByText('Nouvelle note de frais')
      expect(newBillButton).toBeTruthy()
    })

    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        )
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.appendChild(root)
        router()
      })

      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
    })

    test('fetches messages from an API and fails with 500 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error('Erreur 500'))
          },
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})