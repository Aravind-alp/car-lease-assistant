import os
import io
import json
import psycopg2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pypdf import PdfReader
from pydantic import BaseModel, Field
from typing import Optional, List
from google import genai
from google.genai import types

load_dotenv()
ai_client = genai.Client()

app = FastAPI(title="Car Lease & Loan Audit Suite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://signsmart-4zl7.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        return psycopg2.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=os.getenv("DB_PORT", "5432"),
            database=os.getenv("DB_NAME", "car_lease_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "")
            sslmode="require" if os.getenv("DB_HOST") else "prefer"
        )
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        raise e

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Drops the out-of-sync table from the previous step so PostgreSQL can rebuild the new layout fresh
        cursor.execute("DROP TABLE IF EXISTS contracts CASCADE;")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contracts (
                id SERIAL PRIMARY KEY,
                filename TEXT,
                extracted_text TEXT,
                analysis_json TEXT,
                strategy_json TEXT
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ PostgreSQL tables initialized successfully with fresh schema definitions.")
    except Exception as e:
        print(f"⚠️ Table initialization bypass: {str(e)}")

# Force clean database verification layout on launch
init_db()

GLOBAL_ACTIVE_CONTRACT = {"id": None, "text": "", "filename": ""}

# --- STRUCTURED DATA SCHEMAS FOR FINANCING / LOANS ---
class LoanCostPillars(BaseModel):
    financed_amount: Optional[float] = Field(None, description="Base vehicle price minus down payment")
    apr: Optional[float] = Field(None, description="Annual Percentage Rate")
    finance_charge: Optional[float] = Field(None, description="Exact dollar amount the loan costs")
    total_of_payments: Optional[float] = Field(None, description="Total money paid after making all payments")
    amortization_schedule: Optional[str] = Field(None, description="Ratio of interest vs principal paid each month")

class LoanTrapdoors(BaseModel):
    prepayment_penalty_clause: Optional[str] = Field(None, description="Fees charged for paying the loan off early")
    rule_of_78s: Optional[bool] = Field(None, description="True if front-loaded interest calculation is detected")
    origination_fees: Optional[float] = Field(None, description="Upfront administrative fees added to loan balance")
    force_placed_insurance: Optional[str] = Field(None, description="Lender's right to buy expensive insurance if yours lapses")

class LoanTriggerEvents(BaseModel):
    default_definition: Optional[str] = Field(None, description="Number of days late constituting a contract breach")
    acceleration_clause: Optional[str] = Field(None, description="Right to demand entire balance after default")
    repossession_rights: Optional[str] = Field(None, description="Right to seize vehicle without court orders")
    right_to_cure: Optional[str] = Field(None, description="Grace period allowed to fix a default")

# --- STRUCTURED DATA SCHEMAS FOR LEASING ---
class LeaseCostPillars(BaseModel):
    gross_capitalized_cost: Optional[float] = Field(None, description="Agreed-upon initial value of the vehicle")
    capitalized_cost_reduction: Optional[float] = Field(None, description="Total down payment, trade-in, and rebates applied")
    adjusted_capitalized_cost: Optional[float] = Field(None, description="Actual base amount being amortized over time")
    residual_value: Optional[float] = Field(None, description="Predetermined value of the car at lease-end")
    money_factor: Optional[str] = Field(None, description="Lease interest rate written as a decimal or fraction")

class LeaseTrapdoors(BaseModel):
    mileage_allowance: Optional[str] = Field(None, description="Maximum allowed miles/kilometers driven per year or total")
    overage_fee_rate: Optional[str] = Field(None, description="Penalty fee per unit driven over allowance limit")
    disposition_fee: Optional[float] = Field(None, description="Flat fee charged to return the vehicle")
    purchase_option_fee: Optional[float] = Field(None, description="Fee charged if you buy the vehicle later")
    excessive_wear_standards: Optional[str] = Field(None, description="Definitions of scratches, dents, and tire tread")

class LeaseTriggerEvents(BaseModel):
    early_termination_liability: Optional[str] = Field(None, description="Formula calculating fees for breaking lease early")
    gap_insurance_provision: Optional[str] = Field(None, description="Status of coverage if the car is completely totaled")
    default_realization: Optional[str] = Field(None, description="Vehicle seizure rules for unpaid lease installments")

class UniversalLegalShields(BaseModel):
    binding_arbitration: Optional[str] = Field(None, description="Waiver of the right to sue in court")
    class_action_waiver: Optional[str] = Field(None, description="Ban on joining group consumer lawsuits")
    governing_law: Optional[str] = Field(None, description="Jurisdiction ruling the contract")
    lessee_indemnification: Optional[str] = Field(None, description="User assumes liability for legal claims involving car")
    subleasing_restriction: Optional[str] = Field(None, description="Rules or bans on transferring payments to someone else")

class AutomotiveContractAudit(BaseModel):
    contract_type: str = Field(..., description="Must be exactly either 'LOAN' or 'LEASE'")
    contract_fairness_score: int = Field(..., description="Consumer protection health score from 1 to 100")
    loan_pillars: Optional[LoanCostPillars] = None
    loan_trapdoors: Optional[LoanTrapdoors] = None
    loan_triggers: Optional[LoanTriggerEvents] = None
    lease_pillars: Optional[LeaseCostPillars] = None
    lease_trapdoors: Optional[LeaseTrapdoors] = None
    lease_triggers: Optional[LeaseTriggerEvents] = None
    legal_shields: UniversalLegalShields

class AssessmentPlaybook(BaseModel):
    pros: List[str] = Field(..., description="Favorable conditions or items matching standard expectations")
    cons: List[str] = Field(..., description="Unfavorable parameters, missing elements, or hidden cost traps")
    critical_risks: List[str] = Field(..., description="Severe vulnerabilities, liability triggers, or punitive terms")
    negotiable_points: List[str] = Field(..., description="Specific target terms or limits that the user can demand changes for")

class ChatInput(BaseModel):
    question: str

@app.get("/")
def read_root():
    return {"message": "Audit Suite API Running"}

@app.get("/api/v1/contracts")
def get_all_contracts():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename FROM contracts ORDER BY id DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [{"id": r[0], "filename": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/contracts/{contract_id}")
def get_contract_by_id(contract_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT filename, extracted_text, analysis_json, strategy_json FROM contracts WHERE id = %s", (contract_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Requested record not found in system databases.")
        
        GLOBAL_ACTIVE_CONTRACT["id"] = contract_id
        GLOBAL_ACTIVE_CONTRACT["filename"] = row[0]
        GLOBAL_ACTIVE_CONTRACT["text"] = row[1]
        
        return {
            "id": contract_id,
            "filename": row[0],
            "analysis": json.loads(row[2]),
            "strategy": json.loads(row[3]) if row[3] else None
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database execution crash: {str(e)}")

@app.post("/api/v1/upload-contract")
async def upload_contract(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        contents = await file.read()
        pdf_stream = io.BytesIO(contents)
        reader = PdfReader(pdf_stream)
        
        extracted_text = ""
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_text += f"\n--- PAGE {page_num + 1} ---\n" + text

        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="Text extraction missing.")
        
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=extracted_text,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a legal and financial validation model specializing in automotive contracts. "
                    "Determine if the file is a 'LOAN' or a 'LEASE'. Extract all matching key elements accurately. "
                    "Leave non-applicable track properties as null."
                ),
                response_mime_type="application/json",
                response_schema=AutomotiveContractAudit,
            ),
        )
        
        conn = get_db_connection()
        cursor = conn.cursor()
        insert_query = "INSERT INTO contracts (filename, extracted_text, analysis_json, strategy_json) VALUES (%s, %s, %s, %s) RETURNING id"
        cursor.execute(insert_query, (file.filename, extracted_text, json.dumps(response.parsed.model_dump()), None))
        new_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        GLOBAL_ACTIVE_CONTRACT["id"] = new_id
        GLOBAL_ACTIVE_CONTRACT["filename"] = file.filename
        GLOBAL_ACTIVE_CONTRACT["text"] = extracted_text
        
        return {"id": new_id, "filename": file.filename, "status": "Success", "analysis": response.parsed}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/negotiation-strategy")
async def generate_negotiation_strategy():
    if not GLOBAL_ACTIVE_CONTRACT["text"] or not GLOBAL_ACTIVE_CONTRACT["id"]:
        raise HTTPException(status_code=400, detail="Active tracking index missing.")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT strategy_json FROM contracts WHERE id = %s", (GLOBAL_ACTIVE_CONTRACT["id"],))
        row = cursor.fetchone()
        
        if row and row[0]:
            cursor.close()
            conn.close()
            return {"strategy": json.loads(row[0])}
            
        prompt = f"Analyze this automotive agreement. Extract the Pros, Cons, Critical Risks, and specific Negotiable Points into a clean structured JSON schema."
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[GLOBAL_ACTIVE_CONTRACT["text"], prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AssessmentPlaybook
            )
        )
        
        cursor.execute("UPDATE contracts SET strategy_json = %s WHERE id = %s", (json.dumps(response.parsed.model_dump()), GLOBAL_ACTIVE_CONTRACT["id"]))
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"strategy": response.parsed}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat")
async def chat_with_contract(payload: ChatInput):
    if not GLOBAL_ACTIVE_CONTRACT["text"]:
        raise HTTPException(status_code=400, detail="No active document instance cached.")
    try:
        prompt = f"Answer the user query based strictly on the text context below.\n\nCONTEXT:\n{GLOBAL_ACTIVE_CONTRACT['text']}\n\nUSER QUESTION:\n{payload.question}"
        response = ai_client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return {"answer": response.text}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)