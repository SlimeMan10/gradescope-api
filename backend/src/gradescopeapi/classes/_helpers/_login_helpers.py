import requests
from bs4 import BeautifulSoup

from gradescopeapi import DEFAULT_GRADESCOPE_BASE_URL


def get_auth_token_init_gradescope_session(
    session: requests.Session,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> str:
    """
    Go to homepage to parse hidden authenticity token and to set initial "_gradescope_session" cookie
    """
    # go to homepage and set initial "_gradescope_session" cookie
    homepage_resp = session.get(gradescope_base_url)
    homepage_soup = BeautifulSoup(homepage_resp.text, "html.parser")

    # Find the authenticity token using CSS selectors
    auth_token = homepage_soup.select_one(
        'form[action="/login"] input[name="authenticity_token"]'
    )["value"]
    return auth_token


def verify_2fa(
    session: requests.Session,
    code: str,
    auth_token: str,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> tuple[bool, str]:
    """
    Verify 2FA code for Gradescope login
    """
    GS_2FA_ENDPOINT = f"{gradescope_base_url}/two_factor"
    
    # Get the 2FA form token
    two_factor_resp = session.get(GS_2FA_ENDPOINT)
    two_factor_soup = BeautifulSoup(two_factor_resp.text, "html.parser")
    two_factor_token = two_factor_soup.select_one('input[name="authenticity_token"]')["value"]
    
    # Submit 2FA code
    two_factor_data = {
        "utf8": "✓",
        "authenticity_token": two_factor_token,
        "two_factor[code]": code,
        "commit": "Verify"
    }
    
    verify_resp = session.post(GS_2FA_ENDPOINT, data=two_factor_data)
    
    # Check if verification was successful
    if "account" in verify_resp.url:
        # Get CSRF token for future requests
        soup = BeautifulSoup(verify_resp.text, "html.parser")
        csrf_token = soup.select_one('meta[name="csrf-token"]')["content"]
        session.headers.update({"X-CSRF-Token": csrf_token})
        return True, "SUCCESS"
    
    # Check for error messages
    soup = BeautifulSoup(verify_resp.text, "html.parser")
    error_message = soup.select_one('.alert-error')
    if error_message:
        return False, error_message.text.strip()
    
    return False, "INVALID_2FA_CODE"


def login_set_session_cookies(
    session: requests.Session,
    email: str,
    password: str,
    auth_token: str,
    two_factor_code: str = None,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> tuple[bool, str]:
    GS_LOGIN_ENDPOINT = f"{gradescope_base_url}/login"

    # populate params for post request to login endpoint
    login_data = {
        "utf8": "✓",
        "session[email]": email,
        "session[password]": password,
        "session[remember_me]": 0,
        "commit": "Log In",
        "session[remember_me_sso]": 0,
        "authenticity_token": auth_token,
    }

    # login -> Send post request to login endpoint. Sets cookies
    login_resp = session.post(GS_LOGIN_ENDPOINT, params=login_data)
    
    # Check if 2FA is required
    if "two_factor" in login_resp.url:
        if two_factor_code:
            # Try to verify 2FA
            return verify_2fa(session, two_factor_code, auth_token, gradescope_base_url)
        return False, "2FA_REQUIRED"
    
    # Check for other error messages
    soup = BeautifulSoup(login_resp.text, "html.parser")
    error_message = soup.select_one('.alert-error')
    if error_message:
        return False, error_message.text.strip()

    # success marked with cookies set and a 302 redirect to the accounts page
    if (
        # login_resp.history returns a list of redirects that occurred while handling a request
        len(login_resp.history) != 0
        and login_resp.history[0].status_code == requests.codes.found
    ):
        # update headers with csrf token
        # grab x-csrf-token
        csrf_token = soup.select_one('meta[name="csrf-token"]')["content"]

        # update session headers
        session.cookies.update(login_resp.cookies)
        session.headers.update({"X-CSRF-Token": csrf_token})
        return True, "SUCCESS"
    
    return False, "INVALID_CREDENTIALS"
