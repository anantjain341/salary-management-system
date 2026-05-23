def _employee_payload(**overrides):
    data = {
        "full_name": "Aanya Sharma",
        "email": "aanya@example.com",
        "job_title": "Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 50000.0,
        "employment_type": "full_time",
        "hire_date": "2024-06-01",
    }
    data.update(overrides)
    return data


def test_health_endpoint_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_employee_via_api(client):
    payload = _employee_payload()

    response = client.post("/employees", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert body["full_name"] == payload["full_name"]


def test_get_all_employees_via_api(client):
    client.post("/employees", json=_employee_payload(email="a@example.com"))
    client.post("/employees", json=_employee_payload(email="b@example.com"))

    response = client.get("/employees")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2


def test_get_single_employee_via_api(client):
    created = client.post("/employees", json=_employee_payload()).json()

    response = client.get(f"/employees/{created['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_update_employee_via_api(client):
    created = client.post("/employees", json=_employee_payload(salary=50000)).json()

    response = client.put(f"/employees/{created['id']}", json={"salary": 80000})

    assert response.status_code == 200
    assert response.json()["salary"] == 80000


def test_delete_employee_via_api(client):
    created = client.post("/employees", json=_employee_payload()).json()

    delete_response = client.delete(f"/employees/{created['id']}")
    get_response = client.get(f"/employees/{created['id']}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_get_salary_stats_via_api(client):
    client.post("/employees", json=_employee_payload(
        email="a@example.com", country="India", salary=40000
    ))
    client.post("/employees", json=_employee_payload(
        email="b@example.com", country="India", salary=60000
    ))

    response = client.get("/insights/salary-stats", params={"country": "India"})

    assert response.status_code == 200
    body = response.json()
    assert "min_salary" in body
    assert "max_salary" in body
    assert "avg_salary" in body


def test_get_top_paying_titles_via_api(client):
    client.post("/employees", json=_employee_payload(
        email="e@example.com", job_title="Engineer", country="India", salary=40000
    ))
    client.post("/employees", json=_employee_payload(
        email="m@example.com", job_title="Manager", country="India", salary=90000
    ))

    response = client.get("/insights/top-paying-titles", params={"country": "India"})

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_department_breakdown_via_api(client):
    client.post("/employees", json=_employee_payload(
        email="eng@example.com", department="Engineering", salary=70000
    ))
    client.post("/employees", json=_employee_payload(
        email="sales@example.com", department="Sales", salary=50000
    ))

    response = client.get("/insights/department-breakdown")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    for row in body:
        assert "department" in row
        assert "avg_salary" in row
        assert "employee_count" in row
