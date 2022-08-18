/**
 * @jest-environment jsdom
 */

 import { screen, waitFor } from '@testing-library/dom'
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
    test('Then an error message for the file input should be displayed', async() => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('click', handleChangeFile)
      const file =  new File(["hello"], "hello.pdf", { type: "application/pdf" });
      await waitFor(() => userEvent.upload(fileInput, file))
      
      expect(handleChangeFile).toHaveBeenCalled()
      const errorMessage = screen.getByTestId('formFile')
      const dataErrorMessage = errorMessage.getAttribute('data-error-visible')
      expect(dataErrorMessage).toEqual('true')
    })
    test('Then no error message for the file input should be displayed', async() => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByTestId('file')
      fileInput.addEventListener('click', handleChangeFile)
      const file =  new File(["hello"], "hello.jpg", { type: "image/jpeg" });
      await waitFor(() => userEvent.upload(fileInput, file))
      
      expect(handleChangeFile).toHaveBeenCalled()
      const errorMessage = screen.getByTestId('formFile')
      const dataErrorMessage = errorMessage.getAttribute('data-error-visible')
      expect(dataErrorMessage).toEqual('false')
    })
  })
  describe('When I am on NewBill page, I filled in the form correctly and I clicked on submit button', () => {
    test('Then Bills page should be rendered', async() => {
      document.body.innerHTML = NewBillUI()

      const newBills = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      $.fn.modal = jest.fn()
      const handleSubmit = jest.fn((e) => newBills.handleSubmit(e))
      newBills.fileName = 'test.jpg'

      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('click', handleSubmit)

      await waitFor(() => userEvent.click(formNewBill))

      expect(handleSubmit).toHaveBeenCalled()

      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    })
  })
})
