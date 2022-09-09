/**
 * @jest-environment jsdom
 */

 import { fireEvent, screen, waitFor } from '@testing-library/dom'
 import '@testing-library/jest-dom'
 import NewBillUI from '../views/NewBillUI.js'
 import NewBill from '../containers/NewBill.js'
 import BillsUI from '../views/BillsUI.js'
 import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
 import { localStorageMock } from '../__mocks__/localStorage.js'
 import mockStore from '../__mocks__/store'
 import { bills } from '../fixtures/bills.js'
 import router from '../app/Router.js'
import userEvent from '@testing-library/user-event'
 
 jest.mock('../app/store', () => mockStore)


describe("Given I am connected as an employee", () => {
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  }

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

  describe("When I am on NewBill Page", () => {
    test('Then email icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const emailIcon = screen.getByTestId('icon-mail')
      const classEmailIcon = emailIcon.getAttribute('class')
      expect(classEmailIcon).toEqual('active-icon')
    })
  })

  describe('When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png', () => {
    test('Then an error message for the file input should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFile)
      const file =  new File(["hello"], "hello.pdf", { type: "application/pdf" })
      userEvent.upload(fileInput, file)
      
      expect(handleChangeFile).toHaveBeenCalled()
      const errorMessage = screen.getByTestId('formFile')
      const dataErrorMessage = errorMessage.getAttribute('data-error-visible')
      expect(dataErrorMessage).toEqual('true')
    })
    test('Then no error message for the file input should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFile)
      const file =  new File(["hello"], "hello.jpg", { type: "image/jpeg" })
      userEvent.upload(fileInput, file)
      
      expect(handleChangeFile).toHaveBeenCalled()
      const errorMessage = screen.getByTestId('formFile')
      const dataErrorMessage = errorMessage.getAttribute('data-error-visible')
      expect(dataErrorMessage).toEqual('false')
    })
  })
  describe('When I am on NewBill page, I filled in the form correctly and I clicked on submit button', () => {
    test('Then a new bill should be created',()  => {
      document.body.innerHTML = ''
      
      document.body.innerHTML = NewBillUI()

      const newBills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      
      const handleChangeFile = jest.fn((e) => newBills.handleChangeFile(e))
      const handleSubmit = jest.fn((e) => newBills.handleSubmit(e))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('change', handleChangeFile)
      const file =  new File(["hello"], "hello.jpg", { type: "image/jpeg" })
      userEvent.upload(fileInput, file)
      
      const newBill = ({
      type: 'Transports',
      name:  'test99',
      amount: '129',
      date:  '05 Aoû. 2020',
      vat: 20,
      pct: 30,
      commentary: 'Ceci est un test',
      })
      
      const typeNewBill = screen.getByTestId('expense-type')
      const nameNewBill = screen.getByTestId('expense-name')
      const amountNewBill = screen.getByTestId('amount')
      const dateNewBill = screen.getByTestId('datepicker')
      const vatNewBill = screen.getByTestId('vat')
      const pctNewBill = screen.getByTestId('pct')
      const commNewBill = screen.getByTestId('commentary')

      fireEvent.change(typeNewBill, {target: { value: newBill.type }})
      fireEvent.change(nameNewBill, {target: { value: newBill.name }})
      fireEvent.change(amountNewBill, {target: { value: newBill.amount }})
      fireEvent.change(dateNewBill, {target: { value: newBill.date }})
      fireEvent.change(vatNewBill, {target: { value: newBill.vat }})
      fireEvent.change(pctNewBill, {target: { value: newBill.pct }})
      fireEvent.change(commNewBill, {target: { value: newBill.commentary }})
      
      expect(handleChangeFile).toHaveBeenCalled()

      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill)

      expect(handleSubmit).toHaveBeenCalled()
    })
  })
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      )

      document.body.innerHTML = NewBillUI()
    })

    test('Then new bill are added to the API but fetch fails with 404 message error', async () => {
      const spyedMockStore = jest.spyOn(mockStore, 'bills')

      spyedMockStore.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error('Erreur 404')),
        }
      })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname, data: bills })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId('file')

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      await spyedMockStore()

      expect(spyedMockStore).toHaveBeenCalled()

      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()

      spyedMockStore.mockReset()
      spyedMockStore.mockRestore()
    })

    test('Then new bill are added to the API but fetch fails with 500 message error', async () => {
      const spyedMockStore = jest.spyOn(mockStore, 'bills')

      spyedMockStore.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error('Erreur 500')),
        }
      })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname, data: bills })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId('file')

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      await spyedMockStore()

      expect(spyedMockStore).toHaveBeenCalled()

      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()
    })
  })
})
